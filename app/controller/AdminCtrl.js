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
            'button[action=optimizeDB]': {
                tap: 'optimizeDB'
            },
            'button[action=adminResetDB]': {
                tap: 'resetDB'
            },
            'button[action=activateCard]': {
                tap: 'activateCard'
            }
        }
    },
    
    optimizeDB: function() {
        var self = this;
        var db = Config.getDB();
        
        // OPTIMIZE DB
        ViewManager.startLoading('Optimiere Datenbank');
        db.compact().then(function(res) {
            // OPTIMIZE VIEWS
            ViewManager.startLoading('Optimiere Ansichten');   
            return db.viewCleanup();
        }).then(function(res) {   
            Config.restart();
        });
    },
    
    
    resetDB: function() {
        var self = this;
        Config.cancelSync();
        
        Ext.Msg.confirm('Zurücksetzung','Wollen sie wirklich alle Daten zurücksetzen?', function(buttonId) {
            if ( buttonId == 'yes' && !Config.getUser() ) {          
                
                ViewManager.startLoading('Datenbank zurücksetzen');
                Config.resetDB()['catch'](function(err) {
                    ViewManager.stopLoading();
                    ViewManager.handleError(err);
                }).then(function(res) {
                    Config.restart();   
                });
               
            }
        });
    },
    
    activateCard: function() {
        var self = this;
        var profile = Config.getProfile();
        
        ViewManager.startLoading("Aktiviere Karte...");
        
        var finished = function(err) {
            ViewManager.stopLoading();
            if (err) {
                ViewManager.handleError(err);
            } else {
                Ext.Viewport.fireEvent("syncAll");
            }
        };
        
        if ( profile.sign_status == 'config' || profile.sign_status == 'react' ) {
           
            Config.signQueryCert().then(function(cert) {
                Config.getClient().then(function(client) {
                    client.invoke('pos.config','activate_card', [profile.dbid, cert]).then(function(res) {
                       finished();
                    }, function(err) {
                       finished(err);
                    });                
                }, function(err) {
                   finished(err);
                });
            }, function(err) {
                finished(err);
            });      
                  
        } else {
            finished({name:'sign_status_invalid',
                  message: 'Es wurde keine Kartenkonfiguration angefordert!'});
        }
    }
    
});