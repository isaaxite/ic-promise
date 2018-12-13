# ic-promise
a promise class that implemented by isaac

`ic-promise`是一个用于学习的简单`promise library`，它实现了原生promise几乎所有的特征！
目前暂无法实现的有：
1. ic-promise不是一个微任务；

暂时只想到这么一点！

# Install
```
npm i ic-promise
```

# Example
```javascript
const IcPromise = require('ic-promise');
const log = (...rest) => console.log('\n', ...rest);

// normal
new IcPromise((resolve, reject) => {
  log('invoke current self-promise-1.1...');
  setTimeout(() => {
    // reject(new Error('print error'));
    resolve('print current self-promise-1.1...');
  }, 3 * 1000);
})
.then(sender => {
  log('invoke nesting self-promise-1.1...');
  log(sender);
  return new IcPromise((resolve) => {
    setTimeout(() => {
      resolve('print nesting self-promise-1.1...');
    }, 2 * 1000);
  })
  .then((sender) => {
    log('invoke nesting self-promise-1.2...');
    log(sender);
    return 'print nesting self-promise-1.2...';
  })
  .then((sender) => {
    log('invoke nesting self-promise-1.3...');
    log(sender);
    return 'print nesting self-promise-1.3...';
  });
})
.then(sender => {
  log('invoke nesting self-promise-2.1...');
  log(sender);
  return new IcPromise((resolve) => {
    setTimeout(() => {
      resolve('print nesting self-promise-2.1...');
    }, 3 * 1000);
  })
})
.then(sender => {
  log('invoke current self-promise-1.2...');
  log(sender);
})
.catch((err) => {
  log(err);
})
.finally(() => {
  log('finally');
});

// async/await
(async function foo() {
  const data = await new IcPromise((resolve, reject) => {
    setTimeout(() => {
      resolve('isaac');
    }, 3 * 1000);
  })
  .then(sender => {
    return sender;
  })
  .catch((err) => {
    log(err);
  })
  .finally(() => {
    log('finally');
  });
  log(data);
})();

// static methods
IcPromise.resolve('isaac')
  .then((sender) => {
    log(sender);
  });

IcPromise.reject(new Error('isaac'))
  .then((sender) => {
    log(sender);
  })
  .catch((error) => {
    log(error);
  });

IcPromise.all([
  new IcPromise((resolve) => {
    setTimeout(() => {
      resolve(1);
    }, 6000);
  }),
  new IcPromise((resolve, reject) => {
    setTimeout(() => {
      reject(2);
    }, 1000);
  })
  .finally(() => {
    console.log('nesting finally');
  }),
])
.then(senderList => {
  console.log(senderList);
})
.catch((err) => {
  console.log(err);
})
.finally(() => {
  console.log('finally');
});
```

# License

  MIT
