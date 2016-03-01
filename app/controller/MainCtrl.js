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
        'Fpos.view.OrderInputView',
        'Fpos.view.TestView',
        'Fpos.view.ProductViewSmall',
        'Fpos.view.OrderInputViewSmall'
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
            'button[action=sync]' : {
                tap: 'onSyncTap'
            },
            'button[action=updateApp]' : {
                tap: 'onUpdateApp'
            },
            'button[action=provisioning]' : {
                tap: 'onProvisioning'
            },
            'button[action=productMenu]' : {
                tap: 'onShowProductMenu'
            },
            mainView: {
                initialize: 'mainViewInitialize',
                activeitemchange : 'mainActiveItemChange'                   
            },
            mainMenuButton: {
                tap: 'onShowMainMenu'                
            },
            saveRecordButton: {
                tap: 'saveRecord'
            },
            loginButton: {
                tap: 'showLogin'
            }
        }
    },
       
    init: function() {
        this.taxStore = Ext.StoreMgr.lookup("AccountTaxStore");
        this.unitStore = Ext.StoreMgr.lookup("ProductUnitStore");     
        this.categoryStore = Ext.StoreMgr.lookup("AllCategoryStore");
    },
    
    mainViewInitialize: function() {
        var self = this;
        
        // show form event
        Ext.Viewport.on({
            scope: self,
            showForm: self.showForm
        });
       
        // pos reset event
        /*
        Ext.Viewport.on({
            scope: self,
            posReset: self.resetConfig
        });*/

        // reset config
        self.resetConfig();
    },
    
    onSyncTap: function() {        
        if ( !futil.isDoubleTap() ) { 
            ViewManager.hideMenus();
            this.sync();
        }
    },
    
    onUpdateApp: function() {
        if ( !futil.isDoubleTap() ) {
            ViewManager.hideMenus();
            Config.updateApp();
        }
    },
    
    onProvisioning: function() {
        if ( !futil.isDoubleTap() ) {
            ViewManager.hideMenus();
            Config.provisioning();
        }
    },
    
    sync: function(resync) {               
        var self = this;
        var db = Config.getDB();
        var client = null;
        var profile_rev = null;
        var sync_err = null;
        
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
               resync: typeof(resync) === "boolean" && resync || false,
               models: [
                   {
                        model: 'res.partner.title',
                        readonly: true
                   },                   
                   {    
                        model: 'account.tax',
                        fields: ['name',
                                 'amount',
                                 'type',
                                 'price_include',
                                 'sequence'],
                        readonly: true  
                   },
                   {
                        model: 'product.uom',
                        readonly: true 
                   },
                   {
                        model: 'pos.category',
                        view:  '_fpos_category',
                        readonly: true
                   },
                   {
                        model: 'product.product',
                        view:  '_fpos_product',
                        readonly: true,
                        domain: [['available_in_pos','=',true]]
                   },
                   {
                        model: 'res.partner',
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
                   },
                   {
                       model: 'fpos.order'                     
                   },
                   {
                       model: 'fpos.order.line'                       
                   }
               ] 
            });
        }).then(function() {
            ViewManager.stopLoading(); 
            self.resetConfig();
        })['catch'](function(err) {
            ViewManager.stopLoading();
            ViewManager.handleError(err,{
                name: "Unerwarteter Fehler", 
                message: "Synchronisation konnte nicht durchgeführt werden"
            }, true);
            self.resetConfig();
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
            
            // reload
            
            // load category
            self.categoryStore.load({
                callback: function() {
                    
                    // load tax
                    self.taxStore.load({
                        callback: function() {
                        
                            // load product units
                            self.unitStore.load({
                                callback: function() {
                                    // fire reload
                                    Ext.Viewport.fireEvent("reloadData");
                                    // ... and show login
                                    self.showLogin();                                    
                                }
                            });                                        
                        }
                    });   
                }
            });         
        })
        ['catch'](function (error) {
            if ( error.name === 'not_found') {
                self.editConfig();   
            } else {
                ViewManager.handleError(error,{
                    name: "Fehler beim Laden", 
                    message: "Konfiguration konnte nicht geladen werden"
                }, true);
            }
        }); 
    },
            
    resetConfig: function() {
       var self = this;
       var mainView = self.getMainView();
       
       ViewManager.hideMenus();
       
       // pop all views, untail base panel
       /*
       while ( mainView.getActiveItem() && mainView.getActiveItem() != self.basePanel ) {
            mainView.pop();
       }*/
       
       // create base panel
       if ( !self.basePanel ) {
       
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
            
           // base panel    
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
          self.mainActiveItemChange(mainView, self.basePanel);
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
                        text: 'Aktualisieren',
                        action: 'updateApp'  
                    },
                    {
                        xtype: 'button',
                        flex: 1,
                        text: 'Provisioning',
                        action: 'provisioning'  
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
                    },
                    {
                        xtype: 'button',
                        flex: 1,
                        text: 'Kassensturz',
                        action: 'createCashState'
                    },
                    {
                        xtype: 'button',
                        flex: 1,
                        text: 'Drucken',
                        action: 'printAgain'
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
            if ( futil.screenWidth() < 600 ) {
                // smaller pos
                self.posPanel = Ext.create("Ext.Panel", {
                    layout: 'hbox',
                    items: [                       
                        {
                            layout: 'vbox',
                            flex: 1,
                            items: [
                                {
                                    xtype: 'fpos_order',
                                    flex: 1                        
                                },
                                {
                                    xtype: 'fpos_order_input_small'  
                                }                            
                            ]          
                        }              
                    ]
                });
                
                // set left menu                
                var productMenu =  Ext.create('Ext.Menu', {
                        cls: 'ProductMenu',
                        items: [
                            {                                
                                xtype: 'fpos_product_small',
                                height: '100%',
                                width: '194px'
                            }
                        ]    
                });                
                
                Ext.Viewport.setMenu(productMenu, {
                     side: "left",
                     reveal: true
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
                                                 menuButton: this.getMainMenuButton() });
    },
    
    /**
     * show hw test
     */
    showHwTest: function() {
        var self = this;
        self.getMainView().push({
            title: "Test",
            xtype: 'fpos_test'        
        });
    },
    
    /**
     * show form
     */
    showForm: function(view) {
        this.getMainView().push(view);
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
                    return self.sync(true).then(function(err) {
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
    
    showLogin: function() {
        var self = this;
        var db = Config.getDB();
        
        ViewManager.hideMenus();
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
    },
    
    onShowMainMenu: function() {
        if ( !futil.isDoubleTap()) {
           if ( Ext.Viewport.getMenus().right.isHidden() ) {
                Ext.Viewport.showMenu("right");
           } else {
                Ext.Viewport.hideMenu("right");
           }
        }
    },
    
    onShowProductMenu: function() {
        if ( !futil.isDoubleTap()) {
           if ( Ext.Viewport.getMenus().left.isHidden() ) {
                Ext.Viewport.showMenu("left");
           } else {
                Ext.Viewport.hideMenu("left");
           }
        }
    }
});