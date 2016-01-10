cordova.define("cordova-plugin-poshw.PosHw", function(require, exports, module) { /*global require:false, module:false*/

var exec = require('cordova/exec');

var PosHw = {
    
    getStatus: function(successCallback, errorCallback) {
        exec(successCallback, errorCallback, "PosHw", "getStatus", []);
    },
        
    printHtml: function(html, successCallback, errorCallback) {
        exec(successCallback, errorCallback, "PosHw", "printHtml", [html]);
    },
    
    openCashDrawer: function(successCallback, errorCallback) {
        exec(successCallback, errorCallback, "PosHw", "openCashDrawer", []);
    },
    
    setLineDisplay: function(value, successCallback, errorCallback) {
        exec(successCallback, errorCallback, "PosHw", "setLineDisplay", [value]);
    },
    
    startWeighing: function(config, successCallback, errorCallback ) {
        exec(successCallback, errorCallback, "PosHw", "startWeighing", [config]);
    },
    
    stopWeighing: function(weightCallback, successCallback, errorCallback ) {
        exec(successCallback, errorCallback, "PosHw", "stopWeighing");
    }
    
};

module.exports = PosHw;
});
