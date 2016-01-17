/*global Ext:false, futil:false, DBUtil:false*/

Ext.define('Fpos.Config', {
    singleton : true,
    alternateClassName: 'Config',
    requires: [
        'Ext.proxy.PouchDBUtil',
        'Ext.store.LogStore',
        'Ext.client.OdooClient',
        'Ext.ux.Deferred'
    ],
    config : {       
        version : '1.2.1',
        log : 'Ext.store.LogStore',
        databaseName : 'fpos',  
        searchDelay : 500,
        searchLimit : 100,
        leftMenuWidth: 250,
        maxRows : 10,
        settings : null,
        user : null,
        profile: null,
        admin: false,
        hwStatus: { err: null },
        hwStatusId: null
    },
    
    constructor: function(config) {
        this.initConfig(config);
    },
    
    
    testSetup: function() {
        window.PosHw.test(function(res) {
            //debugger;
            window.PosHw.testload(function(res) {
                //debugger; 
            }); 
        });
    },
    
    
    setupHardware: function() {      
        var self = this;  
        var deferred = Ext.create('Ext.ux.Deferred');
    
        // check for poshw plugin
        if ( window.PosHw ) {
            window.PosHw.getStatus(function(hwstatus) {
                // set first status            
                self.setHwStatus(hwstatus);
                
                // init interval
                self.setHwStatusId(setInterval(function() {
                    window.PosHw.getStatus(function(hwstatus) {
                       self.setHwStatus(hwstatus); 
                    }, function(err) {
                       self.setHwStatus({ err : err});
                    });
                 }, 1000));
                 
                 // resolve
                 deferred.resolve(hwstatus);
                 
            }, function(err) {
                self.setHwStatus({ err : err });
                deferred.reject(err);
            });
        } else {
            setTimeout(function() {
                deferred.resolve();
            },0);
        }
        return deferred.promise();
    },
    
    printHtml: function(html) {
        var hwstatus = this.getHwStatus();
        if ( hwstatus.printer.installed ) {
            window.PosHw.printHtml(html);
        }          
    },
 
    applyLog: function(store) {
        if (store) {
            if ( !store ){
                Ext.Logger.warn("The specified store cannot be found", this);
            }
        }
        return store;
    },
      
    getDB: function() {
        var db = DBUtil.getDB(this.getDatabaseName());
        return db;
    },
    
    newClient: function() {
        var settings = this.getSettings();
        if (!settings) 
            throw {
                name : "No Settings",
                message: "No settings to create a client"
            };
            
            
        var client = Ext.create('Ext.client.OdooClient', {
            "host" : settings.host,
            "port" : settings.port,
            "database" : settings.database,
            "login" : settings.login,
            "password" : settings.password            
        });
        
        
        return client;
    }  
});