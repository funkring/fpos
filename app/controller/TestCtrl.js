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
                release: 'testInterface'
            },  
            'button[action=testPrint]' : {
                release: 'testPrint'
            },
            'button[action=testDisplay]' : {
                release: 'testDisplay'
            },
            'button[action=testCashdrawer]' : {
                release: 'testCashdrawer'  
            },
            'button[action=testInfo]' : {
                release: 'testInfo'
            },
            'button[action=delDB]' : { 
                release: 'delDB'
            },
            'button[action=resetDB]' : {
                release: 'resetDB'
            },
            'button[action=resetDistDB]' : {
                release: 'resetDistDB'
            },
            'button[action=testPayworks]' : {
                release: 'testPayworks'
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
        window.PosHw.test(function(res) {
            self.getTestLabel().setHtml(res);
        }, 
        function(err) {
            self.getTestLabel().setHtml(err);
        });
    },
    
    testPrint : function() {        
        var self = this;
        self.beforeTest();
        var html = "<br>Hier ein paar Zeilen" +
                   "<br>um zu testen ob der Druck" +
                   "<br>funktioniert"+
                   "<br><br><br><br><br><br>";
        window.PosHw.printHtml(html, function(res) {
            self.getTestLabel().setHtml(res || '');
        }, 
        function(err) {
            self.getTestLabel().setHtml(err);
        });  
    },
    
    testDisplay : function() {
        var self = this;
        self.beforeTest();
        window.PosHw.display("23",function(res) {
            self.getTestLabel().setHtml("OK!");
        }, 
        function(err) {
            self.getTestLabel().setHtml(err);
        });  
    },
    
    testCashdrawer : function() {
        var self = this;
        self.beforeTest();
        window.PosHw.openCashDrawer(function() {
            self.getTestLabel().setHtml("OK!");
        }, 
        function(err) {
            self.getTestLabel().setHtml(err);
        });  
    },
    
    testInfo : function() {
        var self = this;
        self.beforeTest();
        var db = Config.getDB();
        db.info().then(function(info) {            
           self.getTestLabel().setHtml(            
            "<pre>" +
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
                    self.getTestLabel().setHtml(err);
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
                                self.getTestLabel().setHtml(err);
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
                            self.getTestLabel().setHtml(err);
                        }
                    });
                });        
            }
        });
    },
    
    testPayworks: function() {
        var self = this;
        if ( !window.Payworks ) {
            self.getTestLabel().setHtml('Payworks Iface not available!');
        } else {
            window.Payworks.init({
                integrator: 'OERP',
                mode: 'TEST',
                appName: 'MCASHIER'
            }, function() {
               window.Payworks.payment({
                   amount: 11.0,
                   subject: 'Payment 2001',
                   customId: '2001'
               }, function(res) {
                   self.getTestLabel().setHtml(res);
               }, function(err) {
                   self.getTestLabel().setHtml(err);
               });
            }, function(err) {
                 self.getTestLabel().setHtml(err);
            });
        }
    }
    
});