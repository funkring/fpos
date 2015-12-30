/*global Ext:false, futil:false, DBUtil:false*/

Ext.define('Fpos.Config', {
    singleton : true,
    alternateClassName: 'Config',
    requires: [
        'Ext.proxy.PouchDBUtil',
        'Ext.store.LogStore',
        'Ext.client.OdooClient'
    ],
    config : {       
        version : '1.2.1',
        log : 'Ext.store.LogStore',
        databaseName : 'fpos',  
        searchDelay : 500,
        searchLimit : 100,
        maxRows : 10,
        settings : null,
        user : null,
        profile: null
    },
    
    constructor: function(config) {
        this.initConfig(config);
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
    },
    
    handleError: function(err, alternativeError, forward) {
        if ( !err.name || !err.message) {
            if ( err.data && err.data.name && err.data.message ) {
                err = err.data;
            } else {
                err = alternativeError;
            }
        }
        Ext.Msg.alert(err.name, err.message);
        if (forward) throw err;
        
    }
    
});