/*global Ext:false, futil:false, DBUtil:false*/

Ext.define('Fpos.Config', {
    singleton : true,
    alternateClassName: 'Config',
    requires: [
        'Ext.proxy.PouchDBUtil',
        'Ext.store.LogStore'
    ],
    config : {
        version : '1.2.1',
        log : 'Ext.store.LogStore',
        databaseName : 'fpos',  
        searchDelay : 500,
        searchLimit : 100,
        maxRows : 10,
        pos : null,
        settings : null,
        userName : null
    },
    
    constructor: function(config) {
        this.initConfig(config);
    },
 
    applyLog: function(store) {
        if (store) {
            if ( !store ){
                Ext.Logger.warn("The specified Store cannot be found", this);
            }
        }
        return store;
    },
      
    getDB: function() {
        var db = DBUtil.getDB(this.getDatabaseName());
        return db;
    }
    
});