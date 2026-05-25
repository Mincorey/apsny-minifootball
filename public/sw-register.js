(function () {
  var CURRENT = "apsny-mfl-v5";
  if (!("serviceWorker" in navigator)) return;

  caches.keys().then(function (keys) {
    var hasOld = keys.some(function (k) { return k !== CURRENT; });
    if (hasOld) {
      navigator.serviceWorker.getRegistrations()
        .then(function (regs) {
          return Promise.all(regs.map(function (r) { return r.unregister(); }));
        })
        .then(function () {
          return Promise.all(keys.map(function (k) { return caches.delete(k); }));
        })
        .then(function () {
          window.location.reload(true);
        });
    } else {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("/sw.js");
      });
    }
  }).catch(function () {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("/sw.js");
    });
  });
})();
