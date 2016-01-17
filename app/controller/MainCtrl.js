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
        'Ext.XTemplate',
        'Ext.Panel',
        'Fpos.view.ProductView',
        'Fpos.view.OrderView',
        'Fpos.view.OrderInputView'
    ],
    config: {
        refs: {
            mainView: '#mainView',
            mainMenuButton: '#mainMenuButton',
            saveRecordButton: '#saveRecordButton',
            deleteRecordButton: '#deleteRecordButton',
            loginButton: '#loginButton'
        },
        control: {     
            'button[action=editConfig]' : {
                tap: 'editConfig'
            },
            'button[action=showHwTest]' : {
                tap: 'showHwTest'
            },
            'button[action=testPrint]' : {
                tap: 'testPrint'  
            },
            'button[action=testSetup]' : {
                tap: 'testSetup'  
            },
            'button[action=sync]' : {
                tap: 'sync'
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
            },
            loginButton: {
                tap: 'showLogin'
            }
        }
    },
    
    sync: function() {               
        var self = this;
        var db = Config.getDB();
        var client = null;
        var profile_rev = null;
        var sync_err = null;
        
        // hide menu of shown
        self.hideMainMenu();
        
        // reload config        
        ViewManager.startLoading("Synchronisiere Datenbank");
        return db.get('_local/config').then(function(config) {
            // connect                    
            Config.setSettings(config);
            client = Config.newClient();
            return client.connect();
        })['catch'](function(err) {      
            sync_err = err;            
            throw sync_err;            
        }).then(function() {
            return db.get('_local/profile');  
        }).then(function(profile) {
            profile_rev = profile._rev; 
        })['catch'](function(err) {
            if ( sync_err )
               throw sync_err;
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
                        model: 'res.partner.title'
                   },
                   {
                        model: 'pos.category',
                        view:  '_fpos_category'
                   },
                   {
                        model: 'product.product',
                        view:  '_fpos_product',
                        domain: [['available_in_pos','=',true]]
                   },
                   {
                        model: 'res.partner',
                        domain: [['active','=',true]],
                        fields: ['name',
                                 'title',
                                 'parent_id',
                                 'parent_name',
                                 'ref',
                                 'website',
                                 'comment',
                                 'customer',
                                 'supplier',
                                 'employee',
                                 'function',
                                 'street',
                                 'street2',
                                 'zip',
                                 'city',
                                 'email',
                                 'fax',
                                 'phone',
                                 'mobile',
                                 'is_company']
                   }
               ] 
            });
        }).then(function() {
            ViewManager.stopLoading(); 
        })['catch'](function(err) {
            ViewManager.stopLoading();
            ViewManager.handleError(err,{
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
        ['catch'](function (error) {
            self.editConfig();
        }); 
    },
            
    mainViewInitialize: function() {
       var self = this;
       
       // info template       
       var infoTmpl = null;
       if ( futil.hasSmallRes() ) { 
           infoTmpl = Ext.create('Ext.XTemplate', 
                        '<div style="width:120px;height:120px;margin:auto;">',
                          '<img src="resources/icons/AppInfo_120x120.png">',
                        '</div>',
                        '<p align="center">',
                        'Version {version}',
                        '</p>');
       } else {
           infoTmpl = Ext.create('Ext.XTemplate', 
                        '<div style="width:512px;height:512px;margin:auto;">',
                          '<img src="resources/icons/AppInfo_512x512.png">',
                        '</div>',
                        '<p align="center">',
                        'Version {version}',
                        '</p>');
       }
       
       // get main 
       var mainView = self.getMainView();
       
       // create base panel
       if ( !self.basePanel ) {
           self.basePanel = Ext.create("Ext.Panel", {
                menu: self.getBaseMenu(),
                title: '',
                showLogin: true,
                layout: 'card',
                items: [
                    {
                        xtype: 'component',
                        html: infoTmpl.apply({"version" : Config.getVersion()})                    
                    }
                ]      
           });
           
            // load main view           
           mainView.push(self.basePanel);
       } else {       
          // set active item and menu
          self.basePanel.setActiveItem(0);
          
          // reset menu
          var menu = self.getBaseMenu();
          self.basePanel.config.menu = menu;
          self.basePanel.menu = menu;
         
          // notify change        
          self.mainActiveItemChange(self.getMainPanel(), self.basePanel);
        }
       
       // load hardware
       Config.setupHardware().then(function() {
            self.loadConfig();  
       })['catch'](function(err) {
            ViewManager.handleError(err, {
                name: "Unerwarteter Fehler", 
                message: "Hardware konnte nicht initialisiert werden"
            }, false);          
       });
    },
    
    getBaseMenu: function() {
       if (!this.baseMenu ) {
          this.baseMenu =  Ext.create('Ext.Menu', {
                width: Config.getLeftMenuWidth(),
                scrollable: 'vertical',
                items: [
                    {
                        xtype: 'button',
                        flex: 1,
                        text: 'Einstellungen',
                        action: 'editConfig'             
                    },
                    {
                        xtype: 'button',
                        flex: 1,
                        text: 'Test',
                        action: 'showHwTest'
                    }
                ]    
         });
       }
       return this.baseMenu;
    },
    
    getUserMenu: function() {
       if (!this.userMenu ) {
          this.userMenu =  Ext.create('Ext.Menu', {
                width: Config.getLeftMenuWidth(),
                scrollable: 'vertical',
                items: [
                    {
                        xtype: 'button',
                        flex: 1,
                        text: 'Synchronisieren',
                        action: 'sync'             
                    }
                ]    
         });
       }
       return this.userMenu;
    },
    
    getManagerMenu: function() {
       /*
       if (!this.managerMenu ) {
          this.managerMenu =  Ext.create('Ext.Menu', {
                width: Config.getLeftMenuWidth(),
                scrollable: 'vertical',
                items: [
                ]    
         });
       }
       return this.managerMenu;*/
       return this.getUserMenu();
    },
    
    getAdminMenu: function() {
        /*
        if (!this.adminMenu ) {
          this.adminMenu =  Ext.create('Ext.Menu', {
                width: Config.getLeftMenuWidth(),
                scrollable: 'vertical',
                items: [
                ]    
         });
       }
       return this.adminMenu;*/
       return this.getUserMenu();
    }, 
    
    openPos: function() {
        var self = this;
        if ( !self.posPanel ) {
            if ( futil.hasSmallRes() ) {
                // small pos
                self.posPanel = Ext.create("Ext.Panel", {
                               
                });
            } else {                        
                // big pos
                self.posPanel = Ext.create("Ext.Panel", {
                    layout: 'hbox',
                    items: [
                        {
                            xtype: 'fpos_product',
                            flex: 1   
                        },
                        {
                            xtype: 'panel',
                            layout: 'vbox',
                            items: [
                                {
                                    xtype: 'fpos_order',
                                    flex: 1                        
                                },
                                {
                                    xtype: 'fpos_order_input'  
                                }
                            
                            ]          
                        }              
                    ]
                });
            }
            
            // add view
            self.basePanel.add(self.posPanel);
        }
        
        // set view
        self.basePanel.setActiveItem(1);
        
        // set menu
        var user = Config.getUser();
        var menu = null;
        if ( user.pos_role === 'admin') {
            menu = self.getAdminMenu();
        } else if ( user.pos_role === 'manager' ) {
            menu = self.getManagerMenu();
        } else {
            menu = self.getUserMenu();
        }
        
        // set menu
        self.basePanel.config.menu = menu;
        self.basePanel.menu = menu;
                
        // notify change        
        self.mainActiveItemChange(self.getMainView(), self.basePanel);
    },
    
    // basic save record
    saveRecord: function() {
        var mainView = this.getMainView();
        ViewManager.saveRecord(mainView);
    },
    
    // basic item change
    mainActiveItemChange: function(view, newCard) {    
        // show login
        var loginButton = this.getLoginButton();
        var showLogin = newCard.showLogin || newCard.config.showLogin;
        if ( showLogin ) {
            loginButton.show();            
        } else {
            loginButton.hide();
        }
        
        // update buttons
        ViewManager.updateButtonState(newCard, { saveButton: this.getSaveRecordButton(), 
                                                 deleteButton: this.getDeleteRecordButton(),
                                                 menuButton: this.getMainMenuButton(),
                                                 menuSide: Config.getMenuSide() });
    },
    
    /**
     * show hw test
     */
    showHwTest: function() {
        var self = this;
        self.getMainView().push({
            title: "Test",
            xtype: 'container',
            defaults: {
               cls: 'TestButton'  
            },
            items: [
                {
                    xtype: 'button',
                    text: 'Test Interface',
                    action: 'testInterface'
                },
                {
                    xtype: 'button',
                    text: 'Test Print',
                    action: 'testPrint'
                },
                {
                    xtype: 'button',
                    text: 'Test Display',
                    action: 'testDisplay'
                }
            ]            
        });
    },
    
    // TESTS
    
    testInterface: function() {
       var valid = window.PosHw.test(function(res) {
           debugger;
       }, 
       function(err) {
           debugger;
       });  
    },
    
    
    testPrint: function() {
       var html = "<br/><br/>Hello World<br/><br/>";
       var valid = window.PosHw.printHtml(html, function(res) {
           debugger;
       }, 
       function(err) {
           debugger;
       });
    },
    
    testDisplay: function() {
        window.PosHw.display("23", function(res) {
            debugger;
        },
        function(err) {
            debugger;
        })
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
                    return self.sync().then(function(err) {
                        self.loadConfig();  
                    })['catch'](function(err) {
                        self.editConfig();
                    });
                }
            });

            configForm.setValues(doc);                    
            self.getMainView().push(configForm);
        };
        
        return db.get('_local/config').then( function(doc) {
            load(doc);
        })['catch'](function (error) {
            load({});
        }); 
    },
    
    hideMainMenu: function() {
        if ( !Ext.Viewport.getMenus().right.isHidden() ) {
            Ext.Viewport.hideMenu(Config.getMenuSide());
        }
    },
   
    showMainMenu: function() {
        if ( Ext.Viewport.getMenus().right.isHidden() ) {
            Ext.Viewport.showMenu(Config.getMenuSide());
        } else {
            Ext.Viewport.hideMenu(Config.getMenuSide());
        }
    },
    
    showLogin: function() {
        var self = this;
        var db = Config.getDB();
        
        Config.setAdmin(false);
        Config.setUser(null);
        self.getLoginButton().setText("Anmelden");
        
        if ( !self.pinInput ) {
            // create
            self.pinInput = Ext.create('Ext.view.NumberInputView', {
                    hideOnMaskTap: false,
                    hideOnInputDone: false, 
                    centered : true,
                    ui: "pin",
                    maxlen: 4,
                    minlen: 4,
                    emptyValue: "----",
                    title : "PIN für die Anmeldung"
                });
                
            // add handler
            self.pinInput.setHandler(function(view, pin) {
                var settings = Config.getSettings();
                var profile = Config.getProfile();
                var user = null;
    
                // check profile and search user            
                if ( profile ) {
                    Ext.each(profile.user_ids, function(pos_user) {
                        if ( pos_user.pin === pin ) {
                            user = pos_user;                        
                            return false;
                        }
                    });
                }
                
                if ( !user ) {
                    // check admin                
                    if ( settings && settings.pin === pin && !self.posPanel) {
                        Config.setAdmin(true);
                        view.hide();
                    } else {
                        // user not found
                        view.setError("Ungültiger PIN");
                    }
                } else {
                    // setup user user
                    Config.setUser(user);
                    Config.setAdmin(user.pos_admin);
                    self.getLoginButton().setText(user.name);
                    
                    // hide view and open pos
                    view.hide(); 
                    self.openPos();
                }
                
            });
            
            // show
            Ext.Viewport.add( self.pinInput );
        } else {
            self.pinInput.show();   
        }
          
    }
    
});