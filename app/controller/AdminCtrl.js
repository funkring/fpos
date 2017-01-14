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
            }
        }
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
    }
    
});