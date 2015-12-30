/*global Ext:false, DBUtil:false, PouchDB:false, openerplib:false, futil:false, Fpos:false, Config:false, ViewManager:false */
Ext.define('Fpos.controller.MainCtrl', {
    extend: 'Ext.app.Controller',
    requires: [    
        'Ext.ux.Deferred',
        'Fpos.view.Main',
        'Ext.Menu',
        'Ext.form.ViewManager',        
        'Fpos.Config',
        'Fpos.view.ConfigView',
        'Ext.view.NumberInputView',
        'Ext.proxy.PouchDBUtil',
        'Ext.XTemplate'
    ],
    config: {
        refs: {
            mainView: '#mainView',
            mainMenuButton: '#mainMenuButton',
            saveRecordButton: '#saveRecordButton',
            deleteRecordButton: '#deleteRecordButton'
        },
        control: {     
            'button[action=editConfig]' : {
                tap: 'editConfig'
            },
            mainView: {
                initialize: 'mainViewInitialize',
                activeitemchange : 'mainActiveItemChange'                   
            },
            mainMenuButton: {
                tap: 'showMainMenu'                
            },
            saveRecordButton: {
                tap: 'saveRecord'
            }
        }
    },
    
    sync: function() {               
        var self = this;
        var db = Config.getDB();
        var client = null;
        var profile_rev = null;
        
        // reload config
        ViewManager.startLoading("Synchronisiere Datenbank");
        return db.get('_local/config').then(function(config) {
            // connect                    
            Config.setSettings(config);
            client = Config.newClient();
            return client.connect();
        }).then(function() {
            return db.get('_local/profile');  
        }).then(function(profile) {
            profile_rev = profile._rev; 
        }).catch(function(err) {
            // no profile        
        }).then(function() {
            // load profile
            ViewManager.startLoading("Lade Profil");
            return client.invoke('pos.config','get_profile');
        }).then(function(profile) {
            if (!profile) {
                throw {
                    name: "Kein Profil",
                    message: "Für den Benutzer wurde keine Kasse eingerichtet"
                };
            }
            // save profile
            profile._id = '_local/profile';
            if (profile_rev) {
                profile._rev = profile_rev;                
            }
            return db.put(profile);
        }).then(function() {
            // sync
            ViewManager.startLoading("Synchronisiere Daten");
            return DBUtil.syncWithOdoo(db, client, {
               name: 'fpos',
               models: [
                   {
                        model: 'res.partner',
                        domain: [['active','=',true]]   
                   }
               ] 
            });
        }).then(function() {
            ViewManager.stopLoading(); 
        }).catch(function(err) {
            ViewManager.stopLoading();
            Config.handleError(err,{
                name: "Unerwarteter Fehler", 
                message: "Synchronisation konnte nicht durchgeführt werden"
            }, true);
        });
    },
    
    loadConfig: function() {
        var self = this;
        var db = Config.getDB();
        // load config
        return db.get('_local/config').then(function(config) {                    
            Config.setSettings(config);
            // load profile
            return db.get('_local/profile');           
        })
        .then(function(profile) {
            Config.setProfile(profile);  
            self.showLogin();            
        })
        .catch(function (error) {
            self.editConfig();
        }); 
    },
            
    mainViewInitialize: function() {
       var self = this;
       
       // get size
       var small = false;
       var screenWidth = futil.screenWidth();
       if ( screenWidth < 1024 ) {
            small = true;
       }
       self.small = small;
       
       // info template       
       var infoTmpl = null;
       if ( futil.hasSmallRes() ) { 
           infoTmpl = Ext.create('Ext.XTemplate', 
                        '<div style="width:120px;height:120px;margin:auto;">',
                          '<img src="/resources/icons/AppInfo_120x120.png">',
                        '</div>',
                        '<p align="center">',
                        'Version {version}',
                        '</p>');
       } else {
           infoTmpl = Ext.create('Ext.XTemplate', 
                        '<div style="width:512px;height:512px;margin:auto;">',
                          '<img src="/resources/icons/AppInfo_512x512.png">',
                        '</div>',
                        '<p align="center">',
                        'Version {version}',
                        '</p>');
       }
       
       // create main panel
       var mainPanel = Ext.create("Ext.Component",{
            menu: self.createMainMenu(),
            title: '',
            html: infoTmpl.apply({"version" : Config.getVersion()})       
       });
       
       self.getMainView().push(mainPanel);
       self.loadConfig();       
    },
    
    // basic save record
    saveRecord: function() {
        var mainView = this.getMainView();
        ViewManager.saveRecord(mainView);
    },
    
    // basic item change
    mainActiveItemChange: function(view, newCard) {
        ViewManager.updateButtonState(newCard, { saveButton: this.getSaveRecordButton(), 
                                                 deleteButton: this.getDeleteRecordButton(),
                                                 menuButton: this.getMainMenuButton() });
    },
    
    /**
     * main menu
     */
    createMainMenu: function() {
        var menu =  Ext.create('Ext.Menu', {
                width: 250,
                scrollable: 'vertical',
                items: [
                    {
                        xtype: 'button',
                        flex: 1,
                        text: 'Einstellungen',
                        action: 'editConfig'             
                    }
                ]    
            });
        return menu;
    },
    
    /**
     * edit configuration
     */ 
    editConfig: function() {        
        var self = this;
        var db = Config.getDB();
        
        var load = function(doc) {
            var configForm = Ext.create("Fpos.view.ConfigView",{
                title: 'Konfiguration',
                saveHandler: function(view) {
                    var newValues = view.getValues();
                    newValues._id = '_local/config';
                    return db.put(newValues);
                },
                savedHandler: function() {                    
                    return self.sync().catch(function(err) {
                        self.editConfig();
                    });
                }
            });

            configForm.setValues(doc);                    
            self.getMainView().push(configForm);
        };
        
        return db.get('_local/config').then( function(doc) {
            load(doc);
        }).catch(function (error) {
            load({});
        }); 
    },
    
    hideMainMenu: function() {
        if ( !Ext.Viewport.getMenus().left.isHidden() ) {
            Ext.Viewport.hideMenu('left');
        }
    },
   
    showMainMenu: function() {
        if ( Ext.Viewport.getMenus().left.isHidden() ) {
            Ext.Viewport.showMenu('left');
        } else {
            Ext.Viewport.hideMenu('left');
        }
    },
    
    showLogin: function() {
        if ( !this.pinInput ) {
            this.pinInput = Ext.create('Ext.view.NumberInputView', {
                hideOnMaskTap : false,
                centered : true,
                ui: "pin",
                maxlen: 4,
                minlen: 4,
                emptyValue: "----",
                title : "PIN für die Anmeldung"
            });
        }
        this.pinInput.setHandler(function(value) {
            //if (value !== )
            
        });
        Ext.Viewport.add(this.pinInput);
    }
    
    
});