/*global cordova:false, module:false*/

module.exports = {

    init: function(options, successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, "Payworks", "init", [options]);
    },

    payment: function(options, successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, "Payworks", "payment", [options]);
    },

    cancelPayment: function(options, successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, "Payworks", "cancelPayment", [options]);
    },

    logout: function(successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, "Payworks", "logout", []);
    }

};