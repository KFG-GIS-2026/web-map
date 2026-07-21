if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .then(() => {
        console.log("Service worker registered");
      })
      .catch((error) => {
        console.warn("Service worker registration failed", error);
      });
  });
}
