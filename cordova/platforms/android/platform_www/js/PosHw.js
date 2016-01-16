/*global cordova:false, module:false*/

module.exports = {
    
    test: function(callback) {
       cordova.exec(callback, callback, "PosHw", "test", []);  
    },
    
    testload: function(callback) {
       cordova.exec(callback, callback, "PosHw", "testload", []);  
    },
    
    getStatus: function(successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, "PosHw", "getStatus", []);
    },
        
    printHtml: function(html, successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, "PosHw", "printHtml", [html]);
    },
    
    openCashDrawer: function(successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, "PosHw", "openCashDrawer", []);
    },
    
    setLineDisplay: function(value, successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, "PosHw", "setLineDisplay", [value]);
    },
    
    startWeighing: function(config, successCallback, errorCallback ) {
        cordova.exec(successCallback, errorCallback, "PosHw", "startWeighing", [config]);
    },
    
    stopWeighing: function(weightCallback, successCallback, errorCallback ) {
        cordova.exec(successCallback, errorCallback, "PosHw", "stopWeighing");
    }
    
};