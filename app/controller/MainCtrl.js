/*global Ext:false, DBUtil:false, PouchDB:false, openerplib:false, futil:false, Fpos:false, Config:false, ViewManager:false, console:false*/
Ext.define('Fpos.controller.MainCtrl', {
    extend: 'Ext.app.Controller',
    requires: [    
        'Ext.ux.Deferred',
        'Fpos.view.Main',
        'Ext.Menu',
        'Ext.form.ViewManager',
        'Ext.dataview.List',
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
            printOrderButton: '#printOrderButton',
            saveOrderButtonMobile: '#saveOrderButtonMobile',
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
                tap: 'editConfig'
            },
            'button[action=showHwTest]' : {
                tap: 'showHwTest'
            },
            'button[action=showAdmin]' : {
                tap: 'showAdmin'
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
            'button[action=createCashState]' : {
                tap: 'onCashOperation'
            },  
            'button[action=createCashReport]' : {
                tap: 'onCashOperation'
            }, 
            'button[action=createCashUserReport]' : {
                tap: 'onCashOperation'
            },
            'button[action=fastSwitchUser]' : {
                tap: 'onFastSwitchUser'
            },
            'button[action=closeApp]' : {
                tap: 'onCloseApp'
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
            },
            placeButton: {
                tap: 'showPlace'
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
        
        // sync all
        Ext.Viewport.on({
            scope: self,
            syncAll: self.onSyncTap
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
        
        // show order
        Ext.Viewport.on({
            scope: self,
            showOrder: self.onCashOperation
        });
        
        // add key listener
        ViewManager.pushKeyboardListener(self);
              
        // reset config
        self.resetConfig();
    },
    
    onShowPartner: function() {
        var self = this;
        
        if ( !self.partnerTpl ) {
            self.partnerTpl = Ext.create('Ext.XTemplate',
                    '<div class="PartnerLine">',
                        '<div class="PartnerLine1">',
                            '<div class="PartnerName">{name}</div>',
                            '<div class="PartnerAddress">{[this.getAddress(values)]}</div>',
                            '<div class="PartnerAddress">{[this.getPhone(values)]}</div>',
                        '</div>',                        
                        '<div class="PartnerLine2">',
                            '<tpl if="ga_amount &gt; 0">',                 
                                '<div class="x-button x-button-posInputButtonOrange PartnerInvoiceButton">',
                                    '<div class="PartnerInvoiceLine">',
                                        '<div class="PartnerInvoiceLine PartnerInvoiceHeader">Abrechnung</div>',
                                        '<div class="PartnerInvoiceLine">',
                                            '<div class="PartnerInvoiceLine"><div class="PartnerInvoiceCell1">Belege:</div><div class="PartnerInvoiceCell2">{ga_count}</div></div>',
                                            '<div class="PartnerInvoiceLine"><div class="PartnerInvoiceCell1">Gesamt:</div><div class="PartnerInvoiceCell2">{[futil.formatFloat(values.ga_amount,Config.getDecimals())]} {[Config.getCurrency()]}</div></div>',
                                        '</div>',
                                    '</div>',
                                '</div>',
                            '</tpl>',
                        '</div>',
                    '</div>',
                    {
                        getAddress: function(values) {
                            var addr =  [];                            
                            if ( values.zip ) addr.push(values.zip);
                            if ( values.city ) addr.push(values.city);
                            if ( values.street ) addr.push(values.street);
                            if ( values.street2 ) addr.push(values.street2);                           
                            return addr.join(" - ");
                        }, 
                        getPhone: function (values) {
                            var phone = [];
                            if ( values.mobile ) phone.push(values.mobile);
                            if ( values.phone ) phone.push(values.phone);
                            if ( values.email ) phone.push(values.email);
                            return phone.join(" | ");
                        }
                    });    
            
        }
        
        ViewManager.startLoading("Lade Kunden...");
        Config.getClient().then(function(client) {
              
            var searchList = Ext.create('Ext.field.SearchList',{
                xtype: 'search_list',
                title: 'Partner',
                store: 'OPartnerStore',
                formView: 'fpos_partner_form',
                dataAdd: true,
                searchEmpty: true,
                itemTpl:  self.partnerTpl,
                itemHandler: function(comp, list, index, target, partner, e, opts) {
                    var element = Ext.get(e.target);  
                    
                    // check group invoice
                    if ( element && (element.hasCls('PartnerInvoiceButton') || element.up('div.PartnerInvoiceButton') ) ) {
                        ViewManager.startLoading("Lade Verkäufe...");

                        client.invoke('res.partner', 'fpos_ga_order', [partner.getId()], {}).then(function(orders) {
                            ViewManager.stopLoading();
                            
                            // set data
                            var selectionStore = Ext.StoreMgr.lookup("OrderSelectionStore");
                            selectionStore.setData(orders);
                            
                            // view templatte
                            var orderItemTmpl = Ext.create('Ext.XTemplate', 
                                    '<li>',
                                        '<div class="PosOrderLineDescription">',
                                            '<div class="PosOrderLineName">',                                
                                                '{name}',
                                            '</div>',                   
                                            '<div class="PosOrderLineAmount">',
                                                '{date_order:date("d.m.Y H:i:s")}',
                                                '<span class="PosOrderLineSpan">{journal}</span>',
                                                '<tpl if="pos_reference">',
                                                    '<span class="PosOrderLineSpan">{pos_reference}</span>',
                                                '</tpl>',                   
                                            '</div>',                                            
                                        '</div>',
                                        '<div class="PosOrderLinePrice">{[futil.formatFloat(values.amount_total, Config.getDecimals())]} {[Config.getCurrency()]}</div>',
                                    '</li>'
                                    );
                            
                            // orders
                            var orderList = Ext.create('Ext.dataview.List',{
                                    height: '100%',
                                    flex: 1, 
                                    store: selectionStore,
                                    title: partner.get('name'),
                                    itemTpl: orderItemTmpl,      
                                    itemCls: 'PosOrderItem',
                                    allowDeselect: true,
                                    mode: 'MULTI',
                                    saveable: true,
                                    saveableText: 'Abrechnen',
                                    saveHandler: function() {
                                        //
                                        // check if partner exist,
                                        // and load if it no exist
                                        //
                                        
                                        var db = Config.getDB();
                                        var deferred = Ext.create('Ext.ux.Deferred');
                                        
                                        var data = Config.getPartnerModel();                
                                        data.id = partner.getId();
                                        
                                        Config.getClient().then(function(client) {
                                            client.invoke("jdoc.jdoc", "jdoc_load", [data]).then(function(partnerDoc) {
                                                // set partner data
                                                db.get(partnerDoc._id).then(function(res) {
                                                    // exists not create
                                                    deferred.resolve();
                                                }, function(err) {
                                                    // otherwise create                                                    
                                                    db.put(partnerDoc).then(function(res) {                                                                                                            
                                                        deferred.resolve();
                                                    }, function(err) {
                                                        deferred.reject(err);
                                                    });
                                                });                                                
                                            }, function(err) {
                                                // forward error
                                                deferred.reject(err);
                                            });
                                        }, function(err) {
                                            // forward error
                                            deferred.reject(err);
                                        });
                                       
                                        return deferred.promise();                                            
                                    },
                                    savedHandler: function() {
                                    
                                        // get selected orders
                                        var order_ids = [];
                                        var selectedOrders = orderList.getSelection();
                                        if ( selectedOrders.length === 0 ) {
                                            selectionStore.each(function(record) {
                                                order_ids.push(record.get('id'));    
                                            });
                                        } else {
                                            Ext.each(selectedOrders, function(record) {
                                                order_ids.push(record.get('id'));   
                                            });    
                                        }
                                        
                                        ViewManager.startLoading("Erstelle Sammelrechnung...");
                                        client.invoke('res.partner', 'fpos_ga_order_create', [partner.getId(), order_ids], {}).then(function(order) {
                                            var db = Config.getDB();
                                            db.post(order).then(function(res) {
                                                Ext.Viewport.fireEvent("showOrder", res.id);
                                                self.getMainView().pop();                                                    
                                            }, function(err) {
                                                ViewManager.handleError(err, {name:'Datenbankfehler', message:'Sammelrechnung konnte nicht gespeichert werden'});
                                            });                                                                                                   
                                        }, function(err) {
                                            ViewManager.handleError(err, {name:'Kommunikationsfehler', message:'Sammelrechnung konnte nicht erstellt werden'});
                                        });
                                    }
                            });
                            
                            self.getMainView().push(orderList);                                
                        }, function(err) {                         
                            ViewManager.stopLoading();
                            ViewManager.handleError(err, {name:'Kommunikationsfehler', message:'Verkäufe konnten nicht geladen werden'});
                        });
                        return false;
                    }
                }
            });
            
            searchList.on('painted',function() {
                ViewManager.stopLoading();
            });
            
            self.getMainView().push(searchList);
        }, function(err) {
            ViewManager.stopLoading();
            ViewManager.handleError(err);
        });
    },
    
    onSyncTap: function(s, e) {
        console.log("Sync");
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
       if ( navigator.app ) {
           navigator.app.exitApp();    
       } else if ( navigator.device ) {
           navigator.device.exitApp();
       } else {
           window.close();
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
              
    
    sync: function(resync, callback) {          
        var self = this;
        var db = Config.getDB();
        var client = null;
        var profile_rev = null;
        var profile_doc = null;
        var fullResync = false;
        var sync_err = null;
        var resync_failed = false;
        
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
            resync_failed = profile.resync;
        })['catch'](function(err) {
            if ( sync_err )
               throw sync_err;
            // no profile        
        }).then(function() {
            // load profile           
            ViewManager.startLoading("Lade Profil");
            var action = (resync && 'reset') || (Config.getPosClosed() && 'inc') || '';
            return client.invoke('pos.config','get_profile',[], {action:action});
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
    
            // add sync marker
            profile.resync = true;     
            profile_doc = profile;   
            return db.put(profile);
        }).then(function(res) {
            // update revision
            if ( res.rev ) {
                profile_rev = res.rev;
                profile_doc._rev = profile_rev;
            }
            
            // sync
            ViewManager.startLoading("Synchronisiere Daten");

            // build options            
            var options = {};
            if ( profile_doc.iface_place ) {
                // add filter options if in sync
                options.filter = function(doc) {
                    return doc.fdoo__ir_model !== 'fpos.order' || doc.state !== 'draft'; 
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
                                 'sequence',
                                 'st'],
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
            // CHECK FULL SYNC DB RESET
            // reset only after POS DONE
            // or if LAST SYNC failed
            ViewManager.startLoading("Lade aktualisiertes Profil");
            profile_doc.resync = (profile_doc.fpos_sync_reset && Config.getPosClosed()) || (!resync && resync_failed);
            // GET PROFILE AGAIN, and add check action if it is FULL RESYNC
            return client.invoke('pos.config', 'get_profile', [], {action: profile_doc.fpos_sync_reset && 'check' || ''});
        }).then(function(profile) {
            
            // check profile again
            if (!profile) {
                throw {
                    name: "Kein Profil",
                    message: "Für den Benutzer wurde keine Kasse eingerichtet"
                };
            }
            
            // update profile data
            profile._id = profile_doc._id; // id
            if ( profile_rev ) profile._rev = profile_rev; // rev
            profile.resync = profile_doc.resync; // resync flag
            profile_doc = profile;
            
            // put new profile
            return db.put(profile_doc);
            
        }).then(function() {
            if ( callback )  {
                ViewManager.stopLoading();
                Config.setProfile(profile_doc);
                callback();
            } else {
                // FULL RESET
                Config.restart();
            }
        })['catch'](function(err) {            
            ViewManager.stopLoading();
            
            // notify error to callback
            if ( callback ) {
                callback(err);
            } else {
                ViewManager.handleError(err,{
                    name: "Unerwarteter Fehler", 
                    message: "Synchronisation konnte nicht durchgeführt werden"
                }, true);                
            }            
        });
    },
            
    loadData: function() {
        var self = this;
        try {
            // load data
            ViewManager.startLoading('Lade Daten');
            
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
                                                                    
                                                                    // finish load                                                                           
                                                                    ViewManager.stopLoading();
                                                                    self.showLogin();  
    
                                                                } catch (err) {
                                                                    ViewManager.stopLoading();
                                                                    ViewManager.handleError(err,{
                                                                            name: "Ausnahmefehler beim Laden", 
                                                                            message: "Login konnte nicht geladen werden"
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
        } catch (err) {
            ViewManager.stopLoading();
            ViewManager.handleError(err,{
                    name: "Ausnahmefehler beim Laden", 
                    message: "Daten konnten nicht geladen werden"
            });
        }  
    },
            
    loadConfig: function() {
        var self = this;
        var db = Config.getDB();
        
        try {
            // load config       
            ViewManager.startLoading('Lade Konfiguration');
            db.get('_local/config').then(function(config) {
                ViewManager.startLoading('Lade Profil');
                // set config
                Config.setSettings(config);
                // load profile              
                return db.get('_local/profile');
            }).then(function(profile) {               
                ViewManager.startLoading('Lade Daten');

                // set profile                
                Config.setProfile(profile);
                
                // check resync
                if ( profile.resync ) {
                    var restart = function() {
                         // RESTART
                         Config.restart();
                    };
                    
                    // CHECK if remote DBs should also have a reset
                    var resetRemoteDB = function() {
                        if ( !profile.parent_user_id && Config.getSync() ) {
                            // rebuild sync
                            Config.resetDist().then(function() {
                                return Config.setupRemoteDatabases().then(function() {
                                    restart();
                                }, function(err) {                                
                                    ViewManager.stopLoading();
                                    ViewManager.handleError(err, {name: 'Fehler', message: 'Verteiler konnte nicht initialisiert werden'}, false, function() {
                                         restart();
                                    });
                                });
                            }, function(err) {
                                ViewManager.stopLoading();
                                ViewManager.handleError(err, {name: 'Fehler', message: 'Verteiler konnte nicht zurückgesetzt werden'}, false, function() {
                                     restart();
                                });
                            });
                        } else {
                            restart();
                        }
                    };
                    
                    var handleError = function(err) {
                        // ERROR HANDLING
                        ViewManager.stopLoading();
                        Ext.Msg.confirm('Daten Synchronisation fehlgeschlagen','Keine Internetverbindung zum Server, nochmal versuchen?', function(buttonId) {
                            if ( buttonId == 'yes' ) {          
                                restart();
                            } else {
                                ViewManager.startLoading('Optimiere Daten');   
                                db.compact().then(function(res) {
                                    // OPTIMIZE DB
                                    ViewManager.startLoading('Optimiere Ansichten');   
                                    return db.viewCleanup();
                                }).then(function(res) {   
                                    // LOAD DATA after Optimizing      
                                    ViewManager.stopLoading();          
                                    self.loadData();
                                })['catch'](function(err) {
                                    ViewManager.stopLoading();
                                    ViewManager.handleError(err, {
                                        name: 'Fehler beim Laden',
                                        message: 'Sobald als möglich einen Datenabgleich durchführen, um die Daten zu sichern'
                                    }, false, function(err) {
                                        // LOAD DATA
                                        self.loadData();
                                    });
                                });       
                            }
                        });                       
                    };       
                                        
                    // SYNC AND RESET
                    ViewManager.startLoading('Datenbank sichern');
                    self.sync(false, function(err) {
                        if ( err ) {
                           handleError(err);
                        } else {
                        
                            ViewManager.startLoading('Datenbank zurücksetzen');            
                            Config.resetDB()['catch'](function(err) {                               
                               handleError(err);                               
                            }).then(function(res) {
                                
                                // FULL SYNC
                                self.sync(true, function(err) {                                  
                                    if ( err ) {
                                        handleError(err);
                                    } else {
                                        ViewManager.stopLoading(); 
                                        resetRemoteDB();
                                    }                                
                                });
                                
                            });
                        }
                    });             
                } else {
                    // LOAD DATA
                    ViewManager.stopLoading();
                    self.loadData();
                }
            })['catch'](function(error) {               
                ViewManager.stopLoading();
                if ( error.name === 'not_found') {
                    self.editConfig();   
                } else {
                    ViewManager.handleError(error,{
                        name: "Fehler beim Laden", 
                        message: "Konfiguration konnte nicht geladen werden"
                    });
                }
            }); 
        } catch (err) {
            ViewManager.stopLoading();
            ViewManager.handleError(err,{
                    name: "Ausnahmefehler beim Laden", 
                    message: "Konfiguration konnte nicht geladen werden"
            });
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
        
        if ( self.smallPlaceName ) {
            self.getPlaceButton().setText(place.get('name'));
        } else {
            self.getPlaceButton().setText(place.get('complete_name'));
        }
        
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
        var self = this;
        var profile = Config.getProfile();
        
        // init remote
        if ( !self.remoteLoaded ) {
            self.remoteLoaded = true;
            
            var setupPos = function() {                
                setTimeout(function() {
                    ViewManager.stopLoading();
                    self.openPos();                    
                }, 0);  
            };
            
            var setupRemoteError = function(err) {
                // cancel sync on error
                Config.cancelSync();
                self.remoteLoaded = false;
                ViewManager.stopLoading();
                ViewManager.handleError(err,{
                        name: "Ausnahmefehler beim Laden", 
                        message: "Es konnte keine Verbindung zum Verteiler hergestellt werden"
                });
                // show login on error                
                self.showLogin();    
            };
            
            var setupRemote = function() {
                var remoteDatabases = Config.getRemoteDatabases();
                if ( remoteDatabases.length > 0 ) {                    
                    ViewManager.startLoading("Lade Verbindungen");
                    // TEST REMOTE
                    Config.setupRemoteLinks(remoteDatabases, true).then(function() {
                        // FINAL SETUP
                        Config.setupRemoteLinks(remoteDatabases).then(setupPos, setupRemoteError);
                    }, setupRemoteError);
                } else {
                    setupPos();
                }
            };
            
            var setupProxy = function() {
                ViewManager.startLoading("Lade Proxy");
                Config.setupProxy().then(setupRemote, function(err) {
                     ViewManager.stopLoading();
                     Ext.Msg.alert(err.name || 'Proxy', err.message || 'Kein Verbindung zum Proxy', function() {
                         setupRemote();
                     });
                });
            };
            
            // setup proxy
            setupProxy();
        }
    
        // init vars
        var i;     
        
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
                var productMenuListeners = {};                
                if ( profile.iface_place ) {
                    productMenuListeners.hiddenchange = function(menu) {
                        self.getSaveOrderButtonMobile().setHidden(menu.getHidden());
                    }; 
                }
                
                // set left menu                
                var productMenu =  Ext.create('Ext.Menu', {
                        cls: 'ProductMenu',
                        listeners: productMenuListeners,
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
                
                self.smallPlaceName = true;
                 
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
        var printOrderButton = this.getPrintOrderButton();
        var showSaveOrder = ViewManager.hasViewOption(newCard, 'showSaveOrder');
        if ( showSaveOrder ) {
            saveOrderButton.show();
            printOrderButton.show();
        } else {
            saveOrderButton.hide();
            printOrderButton.hide();
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
                    return self.sync(true)['catch'](function(err) {
                        self.editConfig();
                    });
                }
            });

            configForm.setValues(doc);                    
            self.getMainView().push(configForm);
        };
        
        return db.get('_local/config').then(function(doc) {
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
                
           
            if ( Config.hasNumpad() ) {
                pinInputConfig.showButtons = false;
                pinInputConfig.width = "300px";
            }
            
            self.pinInput = Ext.create('Ext.view.NumberInputView', pinInputConfig);
            
            // check waiter key
            if ( profile.iface_waiterkey ) {
                           
                // enable scanner
                if ( !self.waiterKeyScanner ) {
                    self.waiterKeyScanner = Ext.create('Ext.util.BarcodeScanner', {
                        keyListener : function(keycode) { self.onKeyCode(keycode); },
                        barcodeListener : function(code) { self.onWaiterCode(code); }
                    });
                }                
                
                // forward key event
                self.pinInput.onKeyDown = function(e) {
                    self.onKeyDown(e);   
                };               
            }
                
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
                // prevent showing if loading
                if ( !ViewManager.isLoading() ) {
                    Ext.Viewport.showMenu("left");
                }
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
                    self.onShowProductMenu();
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
            if ( Config.isLogoutCode(code) ) {
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
                if ( Config.supportNativePrint() ) {
                    Config.nativePrint(htmlDoc);       
                } else {
                    var f = view.element.down('#printFrame');
                    f.dom.contentWindow.print();
                }
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
