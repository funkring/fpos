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
            loginButton: '#loginButton',
            placeButton: '#placeButton',
            saveOrderButton: '#saveOrderButton',
            userButton1: '#userButton1',
            userButton2: '#userButton2',
            userButton3: '#userButton3',
            userButton4: '#userButton4',
            userButton5: '#userButton5',
            userButton6: '#userButton6'
        },
        control: {     
            'button[action=editConfig]' : {
                release: 'editConfig'
            },
            'button[action=showHwTest]' : {
                release: 'showHwTest'
            },
            'button[action=sync]' : {
                release: 'onSyncTap'
            },
            'button[action=updateApp]' : {
                release: 'onUpdateApp'
            },
            'button[action=provisioning]' : {
                release: 'onProvisioning'
            },
            'button[action=productMenu]' : {
                release: 'onShowProductMenu'
            },
            'button[action=createCashState]' : {
                release: 'onCashOperation'
            },  
            'button[action=createCashOverview]' : {
                release: 'onCashOperation'
            }, 
            'button[action=createCashOverviewAll]' : {
                release: 'onCashOperation'
            }, 
            'button[action=fastSwitchUser]' : {
                release: 'onFastSwitchUser'
            },
            mainView: {
                initialize: 'mainViewInitialize',
                activeitemchange : 'mainActiveItemChange'                   
            },
            mainMenuButton: {
                release: 'onShowMainMenu'                
            },
            saveRecordButton: {
                release: 'saveRecord'
            },
            loginButton: {
                release: 'showLogin'
            },
            placeButton: {
                release: 'showPlace'
            }            
        }
    },
       
    init: function() {
        this.taxStore = Ext.StoreMgr.lookup("AccountTaxStore");
        this.unitStore = Ext.StoreMgr.lookup("ProductUnitStore");     
        this.categoryStore = Ext.StoreMgr.lookup("AllCategoryStore");
        this.topStore = Ext.StoreMgr.lookup("AllTopStore");
        this.placeStore = Ext.StoreMgr.lookup("PlaceStore");
        this.productStore = Ext.StoreMgr.lookup("ProductStore");
        this.eanDetect = [];
        this.fastUserSwitch = false;
        
        /*
        var self = this;
        self.eanDetectTask = Ext.create('Ext.util.DelayedTask', function() {
            var ean = "";
            if ( self.eanDetect.length == 14 && self.eanDetect[13] == 13 ) {
                //build ean
                Ext.each(self.eanDetect, function(e) {
                    var keycode = e.keyCode ? e.keyCode : e.which;
                    if ( keycode >= 48 && keycode <= 57 ) {            
                        var c = String.fromCharCode(keycode);
                        ean += c;                        
                    }
                });
            } 
                       
            // check if it is ean
            if ( ean.length != 13 ) {
                Ext.each(self.eanDetect, function(event) {
                    // post key
                    Ext.Viewport.fireEvent("posKey",event); 
                });
            } else {
                // post ean
                Ext.Viewport.fireEvent("posScan",ean); 
            }
            
            // reset
            self.eanDetect = [];
        });*/
    },
    
    mainViewInitialize: function() {
        var self = this;
          
        // set user buttons        
        self.userButtons = [
            self.getUserButton1(),
            self.getUserButton2(),
            self.getUserButton3(),
            self.getUserButton4(),
            self.getUserButton5(),
            self.getUserButton6()
        ];
                  
        // show form event
        Ext.Viewport.on({
            scope: self,
            showForm: self.showForm
        });
        
        // place input
        Ext.Viewport.on({
            scope: self,
            placeInput: self.placeInput
        });    
        
        // show place
        Ext.Viewport.on({
            scope: self,
            showPlace: self.showPlace
        });  
      
        // add key listener
        ViewManager.pushKeyboardListener(self);
              
        // reset config
        self.resetConfig();
    },
    
    onSyncTap: function() {        
        ViewManager.hideMenus();
        this.sync();
    },
    
    onUpdateApp: function() {
        ViewManager.hideMenus();
        Config.updateApp();
    },
    
    onProvisioning: function() {
        ViewManager.hideMenus();
        Config.provisioning();
    },
    
    onFastSwitchUser: function(button) {
        if ( button.user ) {
            this.switchUser(button.user);
        }
    },
    
    // setup user user
    switchUser: function(user) {
        Config.setUser(user);
        Config.setAdmin(user.pos_admin);

        // update buttons
        this.getLoginButton().setText(user.name);
        this.updateUserSwitches();
        
         // do user change
        Ext.Viewport.fireEvent("userChange", user);
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
                        model: 'fpos.top',
                        readonly: true
                   },
                   {
                        model: 'fpos.place',
                        readonly: true
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
                       model: 'fpos.order',
                       // nDomain, remove if active is false
                       ndomain: [['active','=',false]]
                   }
               ] 
            });
        }).then(function() {
            ViewManager.stopLoading(); 
            //self.resetConfig();
            // full reset
            window.location.reload();
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
        
        ViewManager.startLoading('Lade Konfiguration');
              
        // load config
        try {
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
                        
                        // load tops
                        self.topStore.load({
                            callback: function() {
                            
                                // load tax
                                self.taxStore.load({
                                    callback: function() {
                                    
                                        // load product units
                                        self.unitStore.load({
                                            callback: function() {
                                                
                                                // load products
                                                self.productStore.load({
                                                    callback: function() {
                                                        // build index
                                                        self.productStore.buildIndex();
                                                        
                                                        // load places
                                                        self.placeStore.load({
                                                            callback: function() {
                                                                // build index
                                                                self.placeStore.buildIndex();
                                                                
                                                                // stop loading
                                                                ViewManager.stopLoading();
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
                                    }
                                });  
                            } 
                        });
                    }
                });         
            })
            ['catch'](function (error) {
                ViewManager.stopLoading();
                if ( error.name === 'not_found') {
                    self.editConfig();   
                } else {
                    ViewManager.handleError(error,{
                        name: "Fehler beim Laden", 
                        message: "Konfiguration konnte nicht geladen werden"
                    }, true);
                }
            }); 
        } catch (err) {
            ViewManager.stopLoading();
            ViewManager.handleError(err,{
                    name: "Ausnahmefehler beim Laden", 
                    message: "Konfiguration konnte nicht geladen werden"
            }, true);
        }
    },
         
    resetConfig: function() {
       var self = this;
       var mainView = self.getMainView();

       // hide all menus       
       ViewManager.hideMenus();
       
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
                title: '',
                layout: 'card',
                items: [
                    {
                        xtype: 'component',
                        html: infoTmpl.apply({"version" : Config.getVersion()})                    
                    }
                ]      
           });
           
            // load main view     
           self.resetBasePanel();
           mainView.push(self.basePanel);
       } else {       
          // reset        
          self.resetBasePanel();
          self.mainActiveItemChange(mainView, self.basePanel);
          
          // set first panel as active item
          self.basePanel.setActiveItem(0);
        }
       
       // load hardware
       Config.setupHardware()['catch'](function(err) {
            ViewManager.handleError(err, {
                name: "Unerwarteter Fehler", 
                message: "Hardware konnte nicht initialisiert werden"
            }, false);          
       }).then(function() {
            self.loadConfig();  
       });
    },
    
    getBaseMenu: function() {
       if (!this.baseMenu ) {
          this.baseMenu =  Ext.create('Ext.Menu', {
                scrollable: 'vertical',
                cls: 'MainMenu',
                defaults: {
                    xtype: 'button',
                    flex: 1,
                    cls: 'MenuButton',
                    ui: 'posInputButtonBlack'  
                },
                items: [
                    {
                        text: 'Einstellungen',
                        action: 'editConfig',
                        ui: 'posInputButtonOrange'    
                    },
                    {
                        text: 'Aktualisieren',
                        action: 'updateApp',
                        ui: 'posInputButtonGreen'  
                    },
                    {
                        text: 'Provisioning',
                        action: 'provisioning'  
                    },
                    {
                        text: 'Test',
                        action: 'showHwTest',
                        ui: 'posInputButtonRed'
                    }
                ]    
         });
       }
       return this.baseMenu;
    },
    
    getUserMenu: function() {
       if (!this.userMenu ) {
          this.userMenu =  Ext.create('Ext.Menu', {
                scrollable: 'vertical',
                cls: 'MainMenu',
                defaults: {
                    xtype: 'button',
                    flex: 1,
                    cls: 'MenuButton',
                    ui: 'posInputButtonBlack'  
                },
                items: [
                    {
                        text: 'Kassensturz',
                        action: 'createCashState',
                        ui: 'posInputButtonOrange'
                    },
                    {
                        text: 'Sicherung und Datenabgleich',
                        action: 'sync',
                        ui: 'posInputButtonGreen'  
                    },        
                    {
                        text: 'Verkäufe Gesamt',
                        action: 'createCashOverviewAll'
                    },             
                    {
                        text: 'Meine Verkäufe',
                        action: 'createCashOverview'
                    },
                    {
                        text: 'Drucken wiederholen',
                        action: 'printAgain'
                    }
                ]    
         });
       }
       return this.userMenu;
    },
    
    getManagerMenu: function() {
       return this.getUserMenu();
    },
    
    getAdminMenu: function() {
       return this.getUserMenu();
    }, 
    
    resetBasePanel: function() {
        ViewManager.setViewOption(this.basePanel, 'showPlace',false);
        ViewManager.setViewOption(this.basePanel, 'showSaveOrder', false); 
        ViewManager.setViewOption(this.basePanel, 'showLogin', true);
        ViewManager.setViewOption(this.basePanel, 'showUserSwitch', false);
        ViewManager.setViewOption(this.basePanel, 'showPlace', false);
        ViewManager.setViewOption(this.basePanel, 'showSaveOrder', false);
        ViewManager.setViewOption(this.basePanel, 'menu', this.getBaseMenu());
    },   
    
    placeInput: function(place) {
        var self = this;
        self.getPlaceButton().setText(place.get('complete_name'));
        self.basePanel.setActiveItem(2);                
        // set view options
        ViewManager.setViewOption(self.basePanel, 'showLogin', false);
        ViewManager.setViewOption(self.basePanel, 'showUserSwitch', false);
        ViewManager.setViewOption(self.basePanel, 'showPlace', true);
        ViewManager.setViewOption(self.basePanel, 'showSaveOrder', true);
        ViewManager.setViewOption(self.basePanel, 'menu', null);
        // notify change        
        self.mainActiveItemChange(self.getMainView(), self.basePanel);
    },
    
    showPlace: function() {
        var self = this;
        self.basePanel.setActiveItem(1);     
        // set view options
        ViewManager.setViewOption(self.basePanel, 'showLogin', !self.fastUserSwitch);
        ViewManager.setViewOption(self.basePanel, 'showUserSwitch', self.fastUserSwitch);
        ViewManager.setViewOption(self.basePanel, 'showPlace',false);
        ViewManager.setViewOption(self.basePanel, 'showSaveOrder', false); 
        ViewManager.setViewOption(self.basePanel, 'menu', self.getMenu()); 
        // notify change        
        self.mainActiveItemChange(self.getMainView(), self.basePanel);
    },
    
    onCashOperation: function() {
        // only if place iface        
        if ( Config.getProfile().iface_place ) {
            var self = this;
            self.basePanel.setActiveItem(2);                
            // set view options
            ViewManager.setViewOption(self.basePanel, 'showLogin', false);
            ViewManager.setViewOption(self.basePanel, 'showUserSwitch', false);
            ViewManager.setViewOption(self.basePanel, 'showPlace', false);
            ViewManager.setViewOption(self.basePanel, 'showSaveOrder', false);
            ViewManager.setViewOption(self.basePanel, 'menu', null);
            // notify change        
            self.mainActiveItemChange(self.getMainView(), self.basePanel);
        }
    },
    
    getMenu: function() {
        var user = Config.getUser();
        if ( user.pos_role === 'admin') {
            return this.getAdminMenu();
        } else if ( user.pos_role === 'manager' ) {
            return this.getManagerMenu();
        } 
        return this.getUserMenu();
    },
    
    openPos: function() {
        var i;
        var self = this;
        var profile = Config.getProfile();
        var mobile = Config.isMobilePos();
        
        // init vars        
        self.fastUserSwitch = profile.iface_fastuswitch && !mobile;        
        for ( i=0; i<self.userButtons.length; i++ ) {
            if ( self.fastUserSwitch ) {
                if ( i < profile.user_ids.length ) {
                    var user = profile.user_ids[i];
                    self.userButtons[i].user = user;
                    self.userButtons[i].setText(user.name);
                }
            } else {
                self.userButtons[i].user = null;
            }
        }  
        
        // places
        if ( profile.iface_place ) {
            if ( !self.topPanel ) {
                self.topPanel = Ext.create("Fpos.view.TopView");
                self.basePanel.add(self.topPanel);                
            }
        }        
        
        // pos panel
        if ( !self.posPanel ) {
            if ( mobile ) {
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
            
            // add panel
            self.basePanel.add(self.posPanel);
        }
        
        // set view
        self.basePanel.setActiveItem(1);
      
        // set view options
        ViewManager.setViewOption(self.basePanel, 'showLogin', !self.fastUserSwitch);
        ViewManager.setViewOption(self.basePanel, 'showUserSwitch', self.fastUserSwitch);
        ViewManager.setViewOption(self.basePanel, 'showPlace', false);
        ViewManager.setViewOption(self.basePanel, 'showSaveOrder', false);
        ViewManager.setViewOption(self.basePanel, 'menu', self.getMenu());
                
        // notify change        
        self.mainActiveItemChange(self.getMainView(), self.basePanel);
    },
    
    // basic save record
    saveRecord: function() {
        var mainView = this.getMainView();
        ViewManager.saveRecord(mainView);
    },
    
    
    // update user switches
    updateUserSwitches: function() {
        var user = Config.getUser();
        if ( this.fastUserSwitch ) {            
            Ext.each(this.userButtons, function(button) {
                var buttonUser = button.user;
                if ( buttonUser ) {
                    if ( user && buttonUser._id == user._id) {
                        button.setCls("x-layout-item x-button-pressing");
                    } else {
                        button.setCls("x-layout-item");
                    }
                }
            });
        }
    },
    
    // basic item change
    mainActiveItemChange: function(view, newCard) {
        var self = this;
            
        // show login
        var loginButton = this.getLoginButton();
        var showLogin = ViewManager.hasViewOption(newCard, 'showLogin'); 
        if ( showLogin ) {
            loginButton.show();            
        } else {
            loginButton.hide();
        }
        
        // show place button
        var placeButton = this.getPlaceButton();
        var showPlace = ViewManager.hasViewOption(newCard, 'showPlace');
        if ( showPlace ) {
            placeButton.show();
        } else {
            placeButton.hide();
        }
        
        // show save order button
        var saveOrderButton = this.getSaveOrderButton();
        var showSaveOrder = ViewManager.hasViewOption(newCard, 'showSaveOrder');
        if ( showSaveOrder ) {
            saveOrderButton.show();
        } else {
            saveOrderButton.hide();
        }
        
        // update user switches
        self.updateUserSwitches();
        var showUserSwitch = ViewManager.hasViewOption(newCard, 'showUserSwitch');        
        Ext.each(self.userButtons, function(button) {
            if ( showUserSwitch && button.user ) {
                button.show();
            } else {
                button.hide();
            }          
        });        
         
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
            var pinInputConfig = {
                    hideOnMaskTap: false,
                    hideOnInputDone: false, 
                    centered : true,
                    ui: "pin",
                    maxlen: 4,
                    minlen: 4,
                    emptyValue: "----",
                    title : "PIN für die Anmeldung"
                };
                
            if ( Config.isMobilePos() ) {
                pinInputConfig.showButtons = false;
                pinInputConfig.width = "300px";
            }
            
            self.pinInput = Ext.create('Ext.view.NumberInputView', pinInputConfig);
                
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
                    // set user
                    self.switchUser(user);
                    
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
       if ( Ext.Viewport.getMenus().right.isHidden() ) {
            Ext.Viewport.showMenu("right");
       } else {
            Ext.Viewport.hideMenu("right");
       }
    },
    
    onShowProductMenu: function() {
       if ( Ext.Viewport.getMenus().left.isHidden() ) {
            Ext.Viewport.showMenu("left");
       } else {
            Ext.Viewport.hideMenu("left");
       }
    },
    
    onKeyDown: function(e) {
        var self = this;
        var mainView = self.getMainView();
        
        // check if is active
        if ( Ext.Viewport.getActiveItem() == mainView && mainView.getActiveItem() == self.basePanel && self.basePanel.getActiveItem() == self.posPanel ) {
            Ext.Viewport.fireEvent("posKey", e);
        }        
    }
});
