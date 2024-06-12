let async = require("neo-async");

function forEach(arr, callback, finalCallback) {
  let len = arr.length;

  function done() {
    if (--len === 0) {
      finalCallback();
    }
  }
  arr.forEach((item) => {
    callback(item, done);
  });
}

let arr = [1, 2, 3];
console.time("cost");
forEach(
  arr,
  (item, done) => {
    setTimeout(() => {
      // console.log(item);
      done();
    }, 1000 * item);
  },
  () => {
    console.timeEnd("cost");
  }
);
