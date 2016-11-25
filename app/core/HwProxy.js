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
    
    getStatus: function(successCallback, errorCallback) {
        openerplib.json_rpc(this.getUrl(), "getStatus", {}, function(err, res) {
            if (err) {
                if (errorCallback) errorCallback(err);
            } else {
                if (successCallback) successCallback(res);
            }
        }, { timeout: this.getTimeout() } );
    },
    
    printHtml: function(html, successCallback, errorCallback) {
        var self = this;
        openerplib.json_rpc(this.getUrl(), "printHtml", {html:html}, function(err, res) {
            if (err) {
                if (errorCallback) errorCallback(err);
            } else {
                if (successCallback) successCallback(res);
            }
        }, { timeout: this.getTimeout() });
    },
    
    scaleInit: function(price, tara, successCallback, errorCallback) {
        openerplib.json_rpc(this.getUrl(), "scaleInit", {price: price, tara: tara}, function(err, res) {
            if (err) {
                if (errorCallback) errorCallback(err);
            } else {
                if (successCallback) successCallback(res);
            }
        }, { timeout: this.getTimeout() });
    },
    
    scaleRead: function(successCallback, errorCallback ) {
        openerplib.json_rpc(this.getUrl(), "scaleRead", {}, function(err, res) {
            if (err) {
                if (errorCallback) errorCallback(err);
            } else {
                if (successCallback) successCallback(res);
            }
        }, { timeout: this.getTimeout() });
    },
    
    display: function(lines, successCallback, errorCallback ) {
        openerplib.json_rpc(this.getUrl(), "display", {lines: lines}, function(err, res) {
            if (err) {
                if (errorCallback) errorCallback(err);
            } else {
                if (successCallback) successCallback(res);
            }
        }, { timeout: this.getTimeout() });
    },
    
    openCashDrawer: function(successCallback, errorCallback) {
        openerplib.json_rpc(this.getUrl(), "openCashDrawer", {}, function(err, res) {
            if (err) {
                if (errorCallback) errorCallback(err);
            } else {
                if (successCallback) successCallback(res);
            }
        }, { timeout: this.getTimeout() });
    },
    
    openExternCashDrawer: function(successCallback, errorCallback) {
        openerplib.json_rpc(this.getUrl(), "openExternCashDrawer", {}, function(err, res) {
            if (err) {
                if (errorCallback) errorCallback(err);
            } else {
                if (successCallback) successCallback(res);
            }
        });
    },
    
    test: function(successCallback, errorCallback) {
        openerplib.json_rpc(this.getUrl(), "test", {}, function(err, res) {
            if (err) {
                if (errorCallback) errorCallback(err);
            } else {
                if (successCallback) successCallback(res);
            }
        }, { timeout: this.getTimeout() });
    },
    
    provisioning: function(successCallback, errorCallback) {
        openerplib.json_rpc(this.getUrl(), "provisioning", {}, function(err, res) {
            if (err) {
                if (errorCallback) errorCallback(err);
            } else {
                if (successCallback) successCallback(res);
            }
        }, { timeout: this.getTimeout() });
    }              
    
});


 
        
   