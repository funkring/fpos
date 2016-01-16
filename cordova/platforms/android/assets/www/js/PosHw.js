/*global cordova:false, module:false*/

module.exports = {
    
    getStatus: function(successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, "PosHw", "getStatus", []);
    },
        
    printHtml: function(html, successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, "PosHw", "printHtml", [html]);
    },
    
    openCashDrawer: function(successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, "PosHw", "openCashDrawer", []);
    },
    
    scaleInit: function(price, tara, successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, "PosHw", "scaleInit", [price, tara]);
    },
    
    scaleRead: function(successCallback, errorCallback ) {
        cordova.exec(successCallback, errorCallback, "PosHw", "scaleRead", []);
    },
    
    display: function(lines, successCallback, errorCallback ) {
        cordova.exec(successCallback, errorCallback, "PosHw", "display", [lines]);
    }
    
};