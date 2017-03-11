/*global Ext:false, Config:false, openerplib:false */


Ext.define('Fpos.core.HwProxy', {
    requires: [],
    
    config : {
        url : 'http://localhost:8045',
        timeout: 5000
    },
    
    constructor: function(config) {
        this.initConfig(config);
    },
    
    call: function(func, params, successCallback, errorCallback) {
        var self = this;
        openerplib.json_rpc(self.getUrl(), func, params, function(err, res) {
            if (err) {
                if ( errorCallback ) {
                    if (err.code == -32001) {
                        errorCallback(err.message);
                    } else {
                        errorCallback(err);
                    }     
                }
            } else {
                if (successCallback) successCallback(res);
            }
        }, { timeout: self.getTimeout() });
    },
    
    getStatus: function(successCallback, errorCallback) {
        this.call("getStatus", {}, successCallback, errorCallback);
    },
    
    printHtml: function(html, successCallback, errorCallback) {
        this.call("printHtml", {html:html}, successCallback, errorCallback);        
    },
    
    scaleInit: function(price, tara, successCallback, errorCallback) {
        this.call("scaleInit", {price: price, tara: tara}, successCallback, errorCallback);
    },
    
    scaleRead: function(successCallback, errorCallback ) {
        this.call("scaleRead", {}, successCallback, errorCallback);        
    },
    
    display: function(lines, successCallback, errorCallback ) {
        if ( typeof lines === 'string' ) lines = [lines];
        this.call("display", {lines: lines}, successCallback, errorCallback);
    },
    
    openCashDrawer: function(successCallback, errorCallback) {
        this.call("openCashDrawer", {}, successCallback, errorCallback);
    },
    
    openExternCashDrawer: function(successCallback, errorCallback) {
        this.call("openExternCashDrawer", {}, successCallback, errorCallback);
    },
    
    test: function(successCallback, errorCallback) {
        this.call("test", {}, successCallback, errorCallback);
    },
    
    provisioning: function(successCallback, errorCallback) {
        this.call("provisioning", {}, successCallback, errorCallback);
    },
    
    scan: function(successCallback, errorCallback) {
        this.call("scan", {}, successCallback, errorCallback);
    },
    
    signTest: function(successCallback, errorCallback) {
        this.call("signTest", {}, successCallback, errorCallback);
    },
    
    signInit: function(config, successCallback, errorCallback) {
        this.call("signInit", {sign_key: config.sign_key,
                               sign_pid: config.sign_pid }, successCallback, errorCallback);
    },
    
    sign: function(receipt, successCallback, errorCallback) {
        this.call("sign", {data: receipt}, successCallback, errorCallback);
    },
    
    signQueryCert: function(successCallback, errorCallback) {
        this.call("signQueryCert", {}, successCallback, errorCallback);
    },
    
    beep: function(successCallback, errorCallback) {
        this.call("beep", {}, successCallback, errorCallback);
    }    
   
});


 
        
   