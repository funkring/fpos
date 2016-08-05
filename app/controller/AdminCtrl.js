/*global Ext:false, DBUtil:false, PouchDB:false, openerplib:false, futil:false, Fpos:false, Config:false, ViewManager:false */
Ext.define('Fpos.controller.AdminCtrl', {
    extend: 'Ext.app.Controller',
    requires: [    
        'Ext.ux.Deferred',
        'Fpos.view.AdminView'
    ],
    config: {
        refs: {
        },
        control: {     
            'button[action=adminResetDB]' : {
                release: 'resetDB'
            },
            'button[action=usbTriggerDownload]' : {
                release: 'usbTriggerDownload'
            }
        }
    },
    
    resetDB: function() {
        var self = this;
        Config.cancelSync();
        
        Ext.Msg.confirm('Zurücksetzung','Wollen sie wirklich alle Daten zurücksetzen?', function(buttonId) {
            if ( buttonId == 'yes' && !Config.getUser() ) {          
                
                var name = "fpos";
                var db = Config.getDB();
                var client = Config.newClient();
                var settings = Config.getSettings();
                
                ViewManager.startLoading('Datenbank zurücksetzen');
                var handleError = function(err) {
                    ViewManager.stopLoading();
                    ViewManager.handleError(err);
                };
                
                // try connect
                client.connect()['catch'](function(err) {
                    handleError(err);
                }).then(function(res) {
                    // reset database
                    DBUtil.resetDB(name, function(err) {
                        if ( !err ) {
                            // get new db
                            db = Config.getDB();
                            // post config
                            delete settings._rev;             
                            db.post(settings)['catch'](function(err) {
                                handleError(err);  
                            }).then(function(res) {
                                // reset odoo database and reload
                                DBUtil.resetOdoo(db, client, name)['catch'](function(err) {
                                    handleError(err);
                                }).then(function(res) {
                                    ViewManager.stopLoading();
                                    window.location.reload();    
                                });
                            });
                        } else {
                           handleError(err);
                        }
                    });
                });        
            }
        });
    },
    
    
    usbTriggerDownload: function() {
        Config.downloadApk('fpos-usb-trigger.apk');
    }
    
});