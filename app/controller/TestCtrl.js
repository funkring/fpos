/*global Ext:false, DBUtil:false, PouchDB:false, openerplib:false, futil:false, Fpos:false, Config:false, ViewManager:false */
Ext.define('Fpos.controller.TestCtrl', {
    extend: 'Ext.app.Controller',
    requires: [    
        'Ext.ux.Deferred',
        'Fpos.view.TestView'
    ],
    config: {
        refs: {
            testLabel: '#testLabel',
            testView: '#testView'
        },
        control: {     
            'button[action=testInterface]' : {
                tap: 'testInterface'
            },  
            'button[action=testPrint]' : {
                tap: 'testPrint'
            },
            'button[action=testDisplay]' : {
                tap: 'testDisplay'
            },
            'button[action=testCashdrawer]' : {
                tap: 'testCashdrawer'  
            },
            'button[action=testInfo]' : {
                tap: 'testInfo'
            },
            'button[action=delDB]' : { 
                tap: 'delDB'
            },
            'button[action=resetDB]' : {
                tap: 'resetDB'
            },
            'button[action=resetDistDB]' : {
                tap: 'resetDistDB'
            },
            'button[action=testPayworks]' : {
                tap: 'testPayworks'
            },
            'button[action=testPayworksInit]' : {
                tap: 'testPayworksInit'
            },
            'button[action=testProvisioning]' : {
                tap: 'testProvisioning'
            },
            'button[action=testCard]' : {
                tap: 'testCard'
            }
        }
    },
    
    // TESTS
    beforeTest: function() {
        this.getTestLabel().setHtml('');
    },
    
    testInterface: function() {
        var self = this;
        self.beforeTest();
        if ( window.PosHw ) {
            window.PosHw.test(function(res) {
                self.getTestLabel().setHtml(res);
            }, 
            function(err) {
                self.objectInfo(err);
            });
        }
    },
    
    testPrint : function() {        
        var self = this;
        self.beforeTest();
        var html = "<br>Hier ein paar Zeilen" +
                   "<br>um zu testen ob der Druck" +
                   "<br>funktioniert"+
                   "<br><br><br><br><br><br>";
        if (window.PosHw) {
            window.PosHw.printHtml(html, function(res) {
                self.getTestLabel().setHtml(res || '');
            }, 
            function(err) {
                self.objectInfo(err);
            });  
        }
    },
    
    testDisplay : function() {
        var self = this;
        self.beforeTest();
        if ( window.PosHw ) {
            window.PosHw.display("23",function(res) {
                self.getTestLabel().setHtml("OK!");
            }, 
            function(err) {
                self.objectInfo(err);
            });  
        }
    },
    
    testCashdrawer : function() {
        var self = this;
        self.beforeTest();
        if ( window.PosHw ) {
            window.PosHw.openCashDrawer(function() {
                self.getTestLabel().setHtml("OK!");
            }, 
            function(err) {
                self.objectInfo(err);
            });  
        }
    },
    
    testInfo : function() {
        var self = this;
        
        self.beforeTest();
        var db = Config.getDB();
        var hwStatusInfo = "";
        
        var hwstatus = Config.getHwStatus();
        if (hwstatus) {
            if ( hwstatus.manufacturer ) {
                hwStatusInfo = hwStatusInfo + "Manufacturer: " + hwstatus.manufacturer + "\n";
            }
            if ( hwstatus.model ) {
                hwStatusInfo = hwStatusInfo + "Model: " + hwstatus.model + "\n";
            }
        } 
        
        db.info().then(function(info) {
           self.getTestLabel().setHtml(            
            "<pre>" +
            hwStatusInfo +
            "Screen Resolution: " + futil.screenWidth().toString() + "x" + futil.screenHeight().toString() + "\n" +
            "Physical Resolution: " + futil.physicalScreenWidth().toString() + "x" + futil.physicalScreenHeight().toString() + "\n" +
            JSON.stringify(info, null, 2) +
            "</pre>"
            );
        });
    },
    
    delDB: function() {
        var self = this;
        Config.cancelSync();
        self.beforeTest();
        Ext.Msg.confirm('Komplett Löschung','Wollen sie wirklich alle Daten löschen?', function(buttonId) {
            if ( buttonId == 'yes' && !Config.getUser() ) {          
                var db = Config.getDB();
                db.destroy().then(function() {
                    window.location.reload();
                })['catch'](function(err) {
                    self.objectInfo(err);
                });
            }
        });
    },
    
    resetDistDB: function() {
        var self = this;
        Config.cancelSync();
        self.beforeTest();
        Ext.Msg.confirm('Zurücksetzung','Wollen sie alle Daten des Verteilers zurücksetzen?', function(buttonId) {
            if ( buttonId == 'yes' && !Config.getUser() ) {
                var profile = Config.getProfile();
                if ( !Ext.isEmpty(profile.fpos_dist_ids) ) {
                    Ext.each(profile.fpos_dist_ids, function(dist) {
                        var distDB = new PouchDB(dist.name);
                        distDB.destroy().then(function() {
                            self.getTestLabel().setHtml(dist.name + " deleted!");
                        })['catch'](function(err) {
                            if  (err) {
                                self.objectInfo(err);                                
                            } else {
                                self.getTestLabel().setHtml(dist.name + " unable to delete!");
                            }
                        });
                    });
                }      
            }
        });    
    },
    
    resetDB: function() {
        var self = this;
        Config.cancelSync();
        self.beforeTest();
        Ext.Msg.confirm('Zurücksetzung','Wollen sie wirklich alle Daten zurücksetzen?', function(buttonId) {
            if ( buttonId == 'yes' && !Config.getUser() ) {          
                
                var name = "fpos";
                var db = Config.getDB();
                var client = Config.newClient();
                var settings = Config.getSettings();
                
                // try connect
                client.connect()['catch'](function(err) {
                    self.getTestLabel().setHtml(err);                
                }).then(function(res) {
                    // reset database
                    DBUtil.resetDB(name, function(err) {
                        if ( !err ) {
                            // get new db
                            db = Config.getDB();
                            // post config
                            delete settings._rev;             
                            db.post(settings)['catch'](function(err) {
                                self.getTestLabel().setHtml(err);
                            }).then(function(res) {
                                // reset odoo database and reload
                                DBUtil.resetOdoo(db, client, name)['catch'](function(err) {
                                     self.getTestLabel().setHtml(err);
                                }).then(function(res) {
                                    window.location.reload();    
                                });
                                    
                            });
                        } else {
                            self.objectInfo(err);
                        }
                    });
                });        
            }
        });
    },
    
    textInfo: function(info) {
        if (info) this.getTestLabel().setHtml('<pre>'+info+'</pre>');
    },
    
    objectInfo: function(obj) {
        if ( obj ) this.textInfo(JSON.stringify(obj, null, 4));  
    },
    
    testPayworks: function() {        
        var self = this;
        self.beforeTest();
        if ( !window.Payworks ) {
            self.textInfo('Payworks Iface not available!');
        } else {
            window.Payworks.init({
                integrator: 'OERP',
                mode: 'TEST',
                appName: 'MCASHIER'
            }, function(res) {
               self.objectInfo(res);
               window.Payworks.payment({
                   amount: 11.0,
                   subject: 'Payment 2001',
                   customId: '2001'
               }, function(res) {
                   self.objectInfo(res);
               }, function(err) {
                   self.objectInfo(err);                   
               });
            }, function(err) {
                 self.objectInfo(err);                 
            });
        }
    },
    
    testPayworksInit: function() {
        var self = this;
        self.beforeTest();
        if ( !window.Payworks ) {
            self.textInfo('Payworks Iface not available!');
        } else {
            window.Payworks.init({
                integrator: 'OERP',
                mode: 'TEST',
                appName: 'MCASHIER'
            }, function(res) {
                self.objectInfo(res);
            }, function(err) {
                 self.objectInfo(err);                 
            });
        }
    },
    
    testProvisioning: function() {
        var self = this;
        self.beforeTest();
        Config.loadProv().then(function(prov) {
            self.objectInfo(prov);
        }, function(err) {
            self.objectInfo(err);
        });
    },
    
    testCard: function() {
        var self = this;
        self.beforeTest();
        if ( window.PosHw ) {
            window.PosHw.cardTest(function(res) {
                self.textInfo(res);
            }, 
            function(err) {
                self.objectInfo(err);
            });
        }
    }    
    
});
