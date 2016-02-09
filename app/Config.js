/*global Ext:false, futil:false, DBUtil:false*/

Ext.define('Fpos.Config', {
    singleton : true,
    alternateClassName: 'Config',
    requires: [
        'Ext.proxy.PouchDBUtil',
        'Ext.store.LogStore',
        'Ext.client.OdooClient',
        'Ext.ux.Deferred',
        'Ext.util.Format'
    ],
    config : {       
        version : '1.2.1',
        log : 'Ext.store.LogStore',
        databaseName : 'fpos',  
        searchDelay : 500,
        searchLimit : 100,
        leftMenuWidth: 250,
        menuSide: 'right',
        maxRows : 10,
        settings : null,
        user : null,
        profile: null,
        currency: "€",
        admin: false,
        decimals: 2,
        qtyDecimals: 3,
        hwStatus: { err: null },
        hwStatusId: null,
        cashJournal: null
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
        if ( window.PosHw && !self.getHwStatusId() ) {
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
    
    hasPrinter: function() {
        var hwstatus = this.getHwStatus();
        return hwstatus.printer && hwstatus.printer.installed; 
    },
    
    printHtml: function(html) {
        if ( this.hasPrinter() ) {
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
      
    formatSeq: function(seq) {
        var profile = this.getProfile();
        var seqStr = Ext.util.Format.leftPad(seq.toString(), profile.sequence_id.padding, '0');
        if ( profile.fpos_prefix ) {
            seqStr =  profile.fpos_prefix + seqStr; 
        }
        return seqStr;
     },
      
    updateProfile: function(profile) {
        var self = this;
        if (profile) {
            // set cash journal
            Ext.each(profile.journal_ids, function(journal) {
                if ( journal.type == 'cash') {
                    self.setCashJournal(journal); 
                    return false;
                }
            }); 
        }
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