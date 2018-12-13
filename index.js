var tooler = {
  isFunction: function(val) {
    return Object.prototype.toString.call(val) === '[object Function]';
  }
};

var senderList = {
  data: [],

  set: function(item, index) {
    this.data.push({
      sender: item,
      order: index
    });
  },

  get: function() {
    this.data.sort(function(prev, next) {
      return prev.order - next.order;
    });
    return this.data.map(function(item) {
      return item.sender;
    });
  } 
};

function IcPromise(cb) {
  if (!tooler.isFunction(cb) && cb) {
    throw new Error('IcPromise\'s param must be a function');
  }
  var _cb = cb || function(resolve) {
    return resolve();
  };
  this._thenQueue = [];
  this._catchQueue = [];
  this._finallyQueue = [];
  this._statusMachine = this._initStatusMachine();
  this._cache = this._initCache();
  this._invokeAsync(_cb);
}

// static methods
IcPromise.resolve = function(sender) {
  return new IcPromise(function(resolve) {
    return resolve(sender);
  });
};

IcPromise.reject = function(sender) {
  return new IcPromise(function(resolve, reject) {
    return reject(sender);
  });
};

IcPromise.all = function(promiseInsList) {
  var completedCount = 0;
  return new IcPromise(function(resolve, reject) {
    promiseInsList.forEach(function(promiseIns, index) {
      promiseIns.then(function(sender) {
        completedCount += 1;
        senderList.set(sender, index);
        if (promiseInsList.length === completedCount) {
          var formatedSenderList = senderList.get();
          return resolve(formatedSenderList);
        }
      }).catch(reject);
    });
  });
};

// private methods
IcPromise.prototype._updateStatusMachine = function(key) {
  var statusMachine = this._statusMachine;
  statusMachine.rejected = false;
  statusMachine.fulfilled = false;
  statusMachine.pending = false;
  statusMachine[key] = true;
};

IcPromise.prototype._initStatusMachine = function() {
  return {
    rejected: false,
    fulfilled: false,
    pending: true  
  };
};

IcPromise.prototype._initCache = function() {
  return {
    sender: null,
    error: null
  };
};

IcPromise.prototype._resolve = function(sender) {
  this._cache.sender = sender;
  this._updateStatusMachine('fulfilled');
  this._invokeQueue();
};

IcPromise.prototype._reject = function(error) {
  this._cache.error = error;
  this._updateStatusMachine('rejected');
  this._invokeQueue();
};

IcPromise.prototype._invokeAsync = function(asyncCallback) {
  var resolve = this._resolve.bind(this);
  var reject = this._reject.bind(this);
  try {
    asyncCallback && asyncCallback(resolve, reject);
  } catch (err) {
    this._updateStatusMachine('rejected');
    this._cache.error = err;
  }
};

IcPromise.prototype._invokeCatchQueue = function() {
  var ctx = this;
  if (ctx._catchQueue.length) {
    var errorHander = ctx._catchQueue.shift();
    errorHander(ctx._cache.error);
    // ctx._finallyQueue.push(function() {
    //   console.log('freezing');
    // });
    ctx._invokeFinallyQueue();
  }
};

IcPromise.prototype._invokeNestPromise = function(nestPromiseIns, thenableErrorHander) {
  var ctx = this;
  nestPromiseIns._finallyQueue.push(function() {
    var fulfilled = nestPromiseIns._statusMachine.fulfilled;
    var rejected = nestPromiseIns._statusMachine.rejected;
    
    if (fulfilled) {
      ctx._cache.sender = nestPromiseIns._cache.sender;
      ctx._invokeThenQueue();
    } else {
      ctx._cache.error = nestPromiseIns._cache.error;
      if (thenableErrorHander) {
        ctx._catchQueue.unshift(thenableErrorHander);
      }
      ctx._invokeCatchQueue();
    }
  });
};

IcPromise.prototype._invokeThenable = function(thenable, thenableErrorHander) {
  var result = null;
  var ctx = this;
  if (!tooler.isFunction(thenable)) {
    throw new Error('thenable must be a function');
  }
  try {
    result = thenable(ctx._cache.sender);
  } catch (error) {
    ctx._updateStatusMachine('rejected');
    ctx._cache.error = error;
    if (thenableErrorHander) {
      ctx._catchQueue.unshift(thenableErrorHander);
    }
    return { isValid: false };
  }
  return {
    isValid: true,
    sender: result
  };
};

IcPromise.prototype._invokeThenQueue = function() {
  var ctx = this;
  if (ctx._thenQueue.length) {
    var thenaQueueItem = ctx._thenQueue.shift();
    var thenable = thenaQueueItem[0];
    var thenableErrorHander = thenaQueueItem[1];
    var result = ctx._invokeThenable(thenable, thenableErrorHander);
    if (!result.isValid) {
      ctx._invokeCatchQueue();
    } else if (result.sender instanceof IcPromise) {
      var nestPromiseIns = result.sender;
      ctx._invokeNestPromise(nestPromiseIns, thenableErrorHander);
    } else {
      ctx._cache.sender = result.sender;
      ctx._invokeThenQueue();
    }
  } else {
    // ctx._finallyQueue.push(function() {
    //   console.log('freezing');
    // });
    ctx._invokeFinallyQueue();
  }
};

IcPromise.prototype._invokeQueue = function() {
  var fulfilled = this._statusMachine.fulfilled;
  if (fulfilled) {
    this._invokeThenQueue();
  } else {
    this._invokeCatchQueue();
  }
};

IcPromise.prototype._invokeFinallyQueue = function() {
  if (this._finallyQueue.length) {
    var finallyHander = this._finallyQueue.shift();
    finallyHander();
    this._invokeFinallyQueue();
  }
};

// public methods
IcPromise.prototype.then = function(thenable, errorHander) {
  this._thenQueue.push([thenable, errorHander]);
  return this;
};

IcPromise.prototype.catch = function(errorHander) {
  this._catchQueue.push(errorHander);
  return this;
};

IcPromise.prototype.finally = function(finallyHander) {
  this._finallyQueue.push(finallyHander);
  return this;
};

module.exports = exports = IcPromise;
