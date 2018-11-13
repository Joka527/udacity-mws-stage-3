import runtime from 'serviceworker-webpack-plugin/lib/runtime'

console.log("register file is read!");
if (navigator.serviceWorker){
    const registration = runtime.register()

    // navigator.serviceWorker.register("./src/js/sw.js").then(regsitration =>{
    //     console.log("Service worker registered!: "+regsitration.scope);
    // }).catch(err => {
    //     console.log("Service worker registeration failed!: "+err);
    // });
}