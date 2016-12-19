/*global Ext:false, DBUtil:false, PouchDB:false, openerplib:false, futil:false, Fpos:false, Config:false, ViewManager:false */
Ext.define('Fpos.controller.MainCtrl', {
    extend: 'Ext.app.Controller',
    requires: [    
        'Ext.ux.Deferred',
        'Fpos.view.Main',
        'Ext.Menu',
        'Ext.form.ViewManager',
        'Ext.field.SearchList',        
        'Fpos.Config',
        'Fpos.view.ConfigView',
        'Ext.view.NumberInputView',
        'Ext.proxy.PouchDBUtil',
        'Ext.XTemplate',
        'Ext.Panel',
        'Fpos.view.ProductView',
        'Fpos.view.OrderView',
        'Fpos.view.OrderInputViewMedium',
        'Fpos.view.OrderInputViewPhone',
        'Fpos.view.OrderInputViewPhoneLeft',
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
            userButton6: '#userButton6',
            userButton7: '#userButton7',
            userButton8: '#userButton8',
            userButton9: '#userButton9'
        },
        control: {     
            'button[action=editConfig]' : {
                release: 'editConfig'
            },
            'button[action=showHwTest]' : {
                release: 'showHwTest'
            },
            'button[action=showAdmin]' : {
                release: 'showAdmin'
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
            'button[action=createCashReport]' : {
                release: 'onCashOperation'
            }, 
            'button[action=createCashUserReport]' : {
                release: 'onCashOperation'
            },
            'button[action=fastSwitchUser]' : {
                release: 'onFastSwitchUser'
            },
            'button[action=closeApp]' : {
                release: 'onCloseApp'
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
    
    onBackButton: function() {
        ViewManager.hideMenus();
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
        
        document.addEventListener("backbutton", this.onBackButton, false);
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
            self.getUserButton6(),
            self.getUserButton7(),
            self.getUserButton8(),
            self.getUserButton9()
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
        
        // logout
        Ext.Viewport.on({
            scope: self,
            logout: self.logout
        });  
        
        
        // sync state
        Ext.Viewport.on({
            scope: self,
            syncState: self.onSyncState
        });
        
        // after silent cash state sync
        Ext.Viewport.on({
            scope: self,
            cashStateSilentFinished: self.onSyncTap
        });
        
        // print html
        Ext.Viewport.on({
            scope: self,
            printHtml: self.printHtml
        });
        
        // waiter key
        Ext.Viewport.on({
            scope: self,
            waiterKey: self.onWaiterKey
        });
        
        // show partner
        Ext.Viewport.on({
            scope: self,
            pact_partner: self.onShowPartner            
        });
        
        // add key listener
        ViewManager.pushKeyboardListener(self);
              
        // reset config
        self.resetConfig();
    },
    
    onShowPartner: function() {
        var self = this;
        Config.getClient().then(function(client) {
            self.getMainView().push({
               xtype: 'search_list',
               title: 'Partner',
               store: 'OPartnerStore',
               formView: 'fpos_partner_form',
               dataAdd: true 
            });
        })['catch'](function(err) {
            ViewManager.handleError(err);
        });
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
    
    onCloseApp: function(button) {
       navigator.app.exitApp(); 
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

            // build options            
            var options = {};
            if ( Config.getSync() ) {
                // add filter options if in sync
                var fpos_user_id = Config.getProfile().user_id;
                options.filter = function(doc) {
                    return doc.fdoo__ir_model !== 'fpos.order' || doc.fpos_user_id == fpos_user_id; 
                };
            }

            // sync            
            return DBUtil.syncWithOdoo(db, client, {
               name: 'fpos',
               resync: typeof(resync) === "boolean" && resync || false,
               auto: ["product.product", "res.partner"],
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
                        domain: [['available_in_pos','=',true]],
                        ndomain: [['available_in_pos','=',true],['active','=',false]]
                   },
                   {
                        model: 'fpos.top',
                        readonly: true
                   },
                   {
                        model: 'fpos.place',
                        readonly: true
                   },
                   
                   Config.getPartnerModel(),
                                      
                   {
                       model: 'fpos.order',
                       // nDomain, remove if active is false
                       ndomain: [['active','=',false]]
                   }
               ] 
            }, options);
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
        
        // load config
        try {
            // cleanup views
            ViewManager.startLoading('Optimiere Views');
            return db.viewCleanup().then(function(res) {
                // optimize db
                ViewManager.startLoading('Optimiere Datenbank');
                return db.compact();
            }).then(function(res) {
                ViewManager.startLoading('Lade Konfiguration');
                // load config                
                return db.get('_local/config');
            }).then(function(config) {
                ViewManager.startLoading('Lade Profil');
                // set config
                Config.setSettings(config);
                // load profile
                return db.get('_local/profile');
            }).then(function(profile) {
                ViewManager.startLoading('Lade Daten');
                // set profile                
                Config.setProfile(profile);
                  
                // reload                
                // load category
                self.categoryStore.load({
                    callback: function() {
                    
                        // build category index
                        self.categoryStore.buildIndex();
                        
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
                                                        ViewManager.startLoading('Erstelle Index');
                                                        try {
                                                            // build index
                                                            self.productStore.buildIndex();
                                                            
                                                            // load places
                                                            self.placeStore.load({
                                                                callback: function() {
                                                                    try {
                                                                    
                                                                        // build index
                                                                        self.placeStore.buildIndex();
                                                                        
                                                                        // define finish of load
                                                                        var finishLoad = function() {
                                                                            // fire reload
                                                                            Ext.Viewport.fireEvent("reloadData");
                                                                            // ... and show login
                                                                            self.showLogin();   
                                                                        };
                                                                        
                                                                        // try setup sync
                                                                        Config.setupRemote()['catch'](function(err) {
                                                                            ViewManager.stopLoading();
                                                                            ViewManager.handleError(err,{
                                                                                    name: "Ausnahmefehler beim Laden", 
                                                                                    message: "Es konnte keine Verbindung zum Verteiler hergestellt werden"
                                                                            });
                                                                            finishLoad();
                                                                        }).then(function() {
                                                                            // stop loading
                                                                            ViewManager.stopLoading();
                                                                            finishLoad();
                                                                        });

                                                                    } catch (err) {
                                                                        ViewManager.stopLoading();
                                                                        ViewManager.handleError(err,{
                                                                                name: "Ausnahmefehler beim Laden", 
                                                                                message: "Daten konnte nicht geladen werden"
                                                                        });
                                                                    }
                                                                }
                                                            });     
                                                        } catch (err) {
                                                            ViewManager.stopLoading();
                                                            ViewManager.handleError(err,{
                                                                    name: "Ausnahmefehler beim Laden", 
                                                                    message: "Produkte konnten nicht geladen werden"
                                                            });
                                                        }                                                        
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
                              '<img src="resources/icons/AppInfo_120x120.png" srcset="resources/icons/AppInfo_120x120.png 1x, resources/icons/AppInfo_120x120_x2.png 2x, resources/icons/AppInfo_120x120_x3.png 3x>',
                            '</div>',
                            '<div>',
                                '<p align="center">',
                                'Version {version}',
                                '</p>',
                            '</div>');
           } else {
               infoTmpl = Ext.create('Ext.XTemplate', 
                            '<div style="width:512px;height:512px;margin:auto;">',
                              '<img src="resources/icons/AppInfo_512x512.png" srcset="resources/icons/AppInfo_512x512.png 1x, resources/icons/AppInfo_512x512_x2.png 2x, resources/icons/AppInfo_512x512_x3.png 3x">',
                            '</div>',
                            '<div>',
                                '<p align="center">',
                                'Version {version}',
                                '</p>',
                            '</div>');
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
          var items = [
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
                        text: 'Administration',
                        action: 'showAdmin',
                        ui: 'posInputButtonOrange'
                    },
                    {
                        text: 'Test',
                        action: 'showHwTest',
                        ui: 'posInputButtonRed'
                    }                    
                ];
        
          if ( navigator.app ) {
              items.push({
                text: 'Beenden',
                action: 'closeApp'
              });
          }        
        
          this.baseMenu =  Ext.create('Ext.Menu', {
                //scrollable: 'vertical',
                cls: 'MainMenu',
                defaults: {
                    xtype: 'button',
                    flex: 1,
                    cls: 'MenuButton',
                    ui: 'posInputButtonBlack'  
                },
                items: items
         });
       }
       return this.baseMenu;
    },
    
    getUserMenu: function() {
       if (!this.userMenu ) {
          var items = [        
                    {
                        text: 'Abschluss und Datenabgleich',
                        action: 'createCashStateSilent',
                        ui: 'posInputButtonOrange'
                    },            
                    {
                        text: 'Sicherung und Datenabgleich',
                        action: 'sync',
                        ui: 'posInputButtonGreen'  
                    },   
                    {
                        text: 'Druck wiederholen',
                        action: 'printAgain'
                    }                 
                ];
                
          // special options
          var profile = Config.getProfile();
          if ( profile ) {
              // no balance, delete first menu entry
              if ( profile.iface_user_nobalance ) {
                    items.shift();
              }
              // add menu print own sales
              if ( profile.iface_user_printsales ) {
                    items.push({
                            text: 'Meine Verkäufe',
                            action: 'createCashUserReport'
                    });
              }               
          }
          
          this.userMenu =  Ext.create('Ext.Menu', {
                //scrollable: 'vertical',
                cls: 'MainMenu',
                defaults: {
                    xtype: 'button',
                    flex: 1,
                    cls: 'MenuButton',
                    ui: 'posInputButtonBlack'  
                },
                items: items
         });
       }
       return this.userMenu;
    },
    
    getManagerMenu: function() {
        if (!this.managerMenu ) {
              var items = [
                        {
                            text: 'Abschluss',
                            action: 'createCashState',
                            ui: 'posInputButtonOrange'
                        },
                        {
                            text: 'Sicherung und Datenabgleich',
                            action: 'sync',
                            ui: 'posInputButtonGreen'  
                        },   
                        {
                            text: 'Druck wiederholen',
                            action: 'printAgain'
                        },
                        {
                            text: 'Meine Verkäufe',
                            action: 'createCashUserReport'
                        },
                        {
                            text: 'Kassenbericht',
                            action: 'createCashReport'
                        }           
                    ];
                            
              if ( navigator.app ) {
                  items.push({
                    text: 'Beenden',
                    action: 'closeApp'
                  });
              }     
              
              this.managerMenu =  Ext.create('Ext.Menu', {
                    //scrollable: 'vertical',
                    cls: 'MainMenu',
                    defaults: {
                        xtype: 'button',
                        flex: 1,
                        cls: 'MenuButton',
                        ui: 'posInputButtonBlack'  
                    },
                    items: items
             });
       }
       return this.managerMenu;
    },
    
    getAdminMenu: function() {
       return this.getManagerMenu();
    }, 
    
    resetBasePanel: function() {
        ViewManager.setViewOption(this.basePanel, 'showPlace', false);
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
        // show product menu
        self.onShowProductMenu();
    },
    
    showPlace: function() {
        var self = this;
        ViewManager.hideMenus();
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
        if ( user ) {
            if ( user.pos_role === 'admin') {
                return this.getAdminMenu();
            } else if ( user.pos_role === 'manager' ) {
                return this.getManagerMenu();
            }
            return this.getUserMenu(); 
        }
        return null;        
    },
    
    openPos: function() {
        // init vars
        var i;
        var self = this;
        var profile = Config.getProfile();
        
        // init users
        var currentUser = Config.getUser();
        var isAdmin = currentUser.pos_role === 'admin';
        
        // init fast user switch
        self.fastUserSwitch = profile.iface_fastuswitch && !Config.isMobilePos();        
        for ( i=0; i<self.userButtons.length; i++ ) {
            if ( self.fastUserSwitch ) {
                if ( i < profile.user_ids.length ) {
                    var user = profile.user_ids[i];
                    if ( isAdmin || user.pos_role == currentUser.pos_role || user.pos_role === 'user' ) {
                        self.userButtons[i].user = user;
                        self.userButtons[i].setText(user.name);
                    }
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
            var keyboardLayout;
            if ( Config.hasNumpad() || Config.isPhonePos() ) {
                // determine keyboard layout
                if ( Config.hasNumpad() ) {
                    keyboardLayout = 'fpos_order_input_small';
                } else {
                    if ( profile.iface_printleft ) {
                        keyboardLayout = 'fpos_order_input_phone_left';
                    } else {
                        keyboardLayout = 'fpos_order_input_phone';    
                    }
                    
                }
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
                                    xtype: keyboardLayout
                                }                            
                            ]          
                        }              
                    ]
                });
                
                // listener only if places
                /*
                var productMenuListeners = {};
                if ( profile.iface_place ) {
                    productMenuListeners.hiddenchange = function(menu) {
                        self.getSaveOrderButtonMobile().setHidden(menu.getHidden());
                    }; 
                }*/
                
                // set left menu                
                var productMenu =  Ext.create('Ext.Menu', {
                        cls: 'ProductMenu',
                        //listeners: productMenuListeners,
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
                keyboardLayout = 'fpos_order_input';
                if ( Config.isMobilePos() || Config.isTabletPos() ) {
                    keyboardLayout = 'fpos_order_input_medium';
                }
            
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
                                    xtype: keyboardLayout
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
        if ( this.fastUserSwitch ) {
            var user = Config.getUser();            
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
        if ( view.getActiveItem() != newCard ) return;
        
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
     * show admin
     */
    showAdmin: function() {
        var self = this;
        self.getMainView().push({
            title: "Administration",
            xtype: 'fpos_admin'        
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
            // get vars
            var title = "PIN für die Anmeldung";
            var profile = Config.getProfile();
            if ( profile ) {
                title = "PIN für " + profile.name;
            }
            
            // create
            var pinInputConfig = {
                    hideOnMaskTap: false,
                    hideOnInputDone: false, 
                    centered : true,
                    ui: "pin",
                    maxlen: 4,
                    minlen: 4,
                    emptyValue: "----",
                    title : title                    
                };
                
            if ( profile.iface_waiterkey ) {
                           
                // enable scanner
                if ( !self.waiterKeyScanner ) {
                    self.waiterKeyScanner = Ext.create('Ext.util.BarcodeScanner', {
                        delay: 160,
                        keyListener : function(keycode) { self.onKeyCode(keycode); },
                        barcodeListener : function(code) { self.onWaiterCode(code); }
                    });
                }                
                
                // forward key event
                pinInputConfig.onKeyDown = function(e) {
                    self.onKeyDown(e);   
                };                
            }
                
            if ( Config.hasNumpad() ) {
                pinInputConfig.showButtons = false;
                pinInputConfig.width = "300px";
            }
            
            self.pinInput = Ext.create('Ext.view.NumberInputView', pinInputConfig);
                
            // add handler
            self.pinInput.setHandler(function(view, pin) {
                var settings = Config.getSettings();              
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
       var menu = Ext.Viewport.getMenus().right;
       if ( menu ) {
           if ( menu.isHidden() ) {
                Ext.Viewport.showMenu("right");
           } else {
                Ext.Viewport.hideMenu("right");
           }
       }
    },
    
    onShowProductMenu: function() {
       var menu = Ext.Viewport.getMenus().left;
       if ( menu ) { 
           if ( menu.isHidden() ) {
                Ext.Viewport.showMenu("left");
           } else {
                Ext.Viewport.hideMenu("left");
           }
       }
    },
    
    onKeyCode: function(code) {    
        if ( this.pinInput && this.pinInput.visible ) {
            this.pinInput.onKeyCode(code);
        }  
    },
    
    onKeyDown: function(e) {
        var self = this;
        var mainView = self.getMainView();
        
        // check if is active
        if ( Ext.Viewport.getActiveItem() == mainView && mainView.getActiveItem() == self.basePanel && self.basePanel.getActiveItem() == self.posPanel ) {
            // forward scan
            if ( self.basePanel.getActiveItem() == self.posPanel ) {
                // scan
                if ( e.keyCode == 229 ) {
                    if ( !ViewManager.isLoading() ) {
                        self.onShowProductMenu();
                    }
                } else {
                    // otherwise            
                    Ext.Viewport.fireEvent("posKey", e);
                }           
            } 
        }
        // check for waiter key 
        else if ( self.waiterKeyScanner ) {
            if ( self.basePanel.getActiveItem() == self.topPanel || ( self.pinInput && self.pinInput.visible ) ) {
                self.waiterKeyScanner.detectBarcode(e);
            }
        }   
    },
    
    onSyncState: function(state) {
        if ( state == 'error' ) {
            this.getMainMenuButton().setBadgeText('1');
        } else {
            this.getMainMenuButton().setBadgeText('');
        }
    },
        
    onWaiterKey: function(code) { 
        var self = this;
        var profile = Config.getProfile();
        var loginUser = null;
        
        // search user
        Ext.each(profile.user_ids, function(user) {
            if ( user.code == code ) {
                loginUser = user;
                return false;    
            }
             
        });
        
        if ( loginUser ) {
            // switch user
            self.switchUser(loginUser);
               
            // hide login
            if ( self.pinInput ) {            
                if ( self.pinInput.visible) self.pinInput.hide();            
            }   
            
            // openpos
            self.openPos();        
        } else {
            ViewManager.handleError({
                name: 'unknown_key',
                message: 'Schlüssel ' + code + ' ist nicht hinterlegt'
            });
        }
    },
    
    logout: function() {
        var self = this;
        if ( !self.pinInput.visible ) {
            if ( Config.getProfile().iface_place ) {
                self.showPlace();           
            }
            
            // show login
            setTimeout(function() {
                self.showLogin();
            },0); 
        }
    },
        
    onWaiterCode: function(code) {
        if ( ViewManager.isLoading() ) return;
        if ( code ) {
            if ( code == Config.getLogoutCode() ) {
                this.logout();
            } else if ( code.length > 13 ) {
                Ext.Viewport.fireEvent('waiterKey', code);
            }         
        }
    },
    
    printHtml: function(html) {
        var self = this;
        var title = 'Druckvorschau';
        
        // check if it is an object
        if (typeof html === 'object') {
            title = html.title;
            html = html.html;
        }
        
        if ( !self.printTemplate ) {
            self.printTemplate = Ext.create('Ext.XTemplate',
                   '<!doctype html>',
                   '<html>',
                       '<head>',
                            '<meta charset="utf-8">',
                            '<title>Belegdruck</title>',
                            '<style>',                                 
                                'body {["{"]}',
                                    'font-family: monospace;',              
                                '{["}"]}',
                                'p {["{"]}',
                                    'line-height: 0.6;',
                                '{["}"]}',
                            '</style>',
                       '</head>',
                       '<body>',
                            '{html}',
                       '</body>',                    
                   '</html>');
        }
        
        var htmlDoc = self.printTemplate.apply({html:html});
        var printContainer = '<div class="PrintContent">' +
                                '<iframe id="printFrame" frameborder="0" allowfullscreen>' +
                                '</iframe>' +
                             '</div>';
        
        self.getMainView().push({
            xtype: 'panel', 
            cls: 'PrintReport',            
            layout: 'vbox',
            html: printContainer,
            title: title,
            saveable: true,
            saveableText: 'Drucken',
            saveHandler: function(view) {
                var f = view.element.down('#printFrame');
                f.dom.contentWindow.print();
            },
            listeners: {
                painted: function() {
                    var e = this.element;
                    var f = e.down('#printFrame');
                    f.setHeight(e.getHeight());
                    var contentWindow = f.dom.contentWindow;
                    var childDoc = contentWindow.document;
                    childDoc.open();
                    childDoc.write(htmlDoc);
                    childDoc.close();
                }
            }                     
        });
    }
    
});
