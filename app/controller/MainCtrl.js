/*global Ext:false, DBUtil:false, PouchDB:false, openerplib:false, futil:false, Fpos:false, Config:false, ViewManager:false */
Ext.define('Fpos.controller.MainCtrl', {
    extend: 'Ext.app.Controller',
    requires: [    
        'Fpos.view.Main',
        'Ext.Menu',
        'Ext.form.ViewManager',        
        'Fpos.Config',
        'Fpos.view.ConfigView',
        'Ext.view.NumberInputView'
    ],
    config: {
        refs: {
            mainView: '#mainView',
            mainMenuButton: '#mainMenuButton',
            saveRecordButton: '#saveRecordButton',
            deleteRecordButton: '#deleteRecordButton'
        },
        control: {           
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
    
    loadConfig: function() {
        var self = this;
        var db = Config.getDB();
        db.get('_local/config').then(function(config) {
            self.setSettings(config);
            db.info(function(err, info) {
                var mainView = self.getMainView();
                mainView.reset();
                mainView.push(Ext.create("Ext.Component",{
                    title: 'Fpos ' + Config.getVersion()                  
                }));    
                self.showLogin();           
            });         
        }).catch(function (error) {
            self.editConfig();
        }); 
    },
    
    mainViewInitialize: function() {     
       this.loadConfig();
    },
    
    // basic save record
    saveRecord: function() {
        ViewManager.saveRecord(this.getMainView());
    },
    
    // basic item change
    mainActiveItemChange: function(view, newCard) {
        ViewManager.updateButtonState(newCard, this.getSaveRecordButton(), this.getDeleteRecordButton());
    },
    
    createMainMenu: function() {
        var menu = Ext.create('Ext.Menu', {
            width: 250,
            scrollable: 'vertical',
            items: [
                
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
                    self.loadConfig();
                }
            });

            configForm.setValues(doc);                    
            self.getMainView().push(configForm);
        };
        
        db.get('_local/config').then( function(doc) {
            load(doc);
        }).catch(function (error) {
            load({});
        }); 
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
            
            
        });
        Ext.Viewport.add(this.pinInput);
    }
    
    
});