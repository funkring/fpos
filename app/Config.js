/*global Ext:false, futil:false, DBUtil:false, LocalFileSystem:false, FileTransfer:false, ViewManager:false, wallpaper:false, cordova:false, PouchDB:false */

Ext.define('Fpos.Config', {
    singleton : true,
    alternateClassName: 'Config',
    requires: [
        'Ext.proxy.PouchDBUtil',
        'Ext.store.LogStore',
        'Ext.client.OdooClient',
        'Ext.ux.Deferred',
        'Ext.util.Format',
        'Ext.form.ViewManager',
        'Fpos.core.Printer',
        'Fpos.core.HwProxy'
    ],
    config : {       
        version : '4.0.8',
        log : 'Ext.store.LogStore',
        databaseName : 'fpos',  
        searchDelay : 500,
        displayDelay: 800,
        searchLimit : 100,
        leftMenuWidth: 250,
        maxRows : 10,
        settings : null,
        user : null,
        users: null,
        profile: null,
        currency: "€",
        admin: false,
        decimals: 2,
        wallpaperUrl: "http://downloads.oerp.at/oerp_android_wallpaper_",
        apkUrl: "http://downloads.oerp.at/fpos_4.apk",
        downloadUrl: "http://downloads.oerp.at",
        qtyDecimals: 3,
        hwStatus: { err: null },
        cashJournal: null,
        sync: false,
        syncState: 'idle',
        syncHandlers: null,
        journalById: {}
    },
    
    constructor: function(config) {
        this.initConfig(config);
    },
        
    testSetup: function() {
        window.PosHw.test(function(res) {
            //debugger;
            window.PosHw.testload(function(res) {
                //debugger; 
            }); 
        });
    },
    
    setupHardware: function() {      
        var self = this;  
        var deferred = Ext.create('Ext.ux.Deferred');
    
        // check for poshw plugin
        if ( window.PosHw ) {
            window.PosHw.getStatus(function(hwstatus) {
                // set first status            
                self.setHwStatus(hwstatus);
                // resolve
                deferred.resolve(hwstatus);
                 
            }, function(err) {
                self.setHwStatus({ err : err });
                deferred.reject(err);
            });
        } else {
            setTimeout(function() {
                deferred.resolve();
            },0);
        }
        return deferred.promise();
    },
    
    notifySyncState: function(syncState) {
        this.setSyncState(syncState);
        Ext.Viewport.fireEvent('syncState', syncState);
    },
    
    addSync: function(syncHandlers, dest) {
        var deferred = Ext.create('Ext.ux.Deferred');
        var self = this;
        
        // check dest        
        if ( !dest ) {
            setTimeout(function() {
                deferred.reject();
            },0);
            return deferred.promise();
        }
        
        // init databses
        var destDB = new PouchDB(dest);
        var db = self.getDB();
        
        // init filter
        var filterVersion = 'fpos_v3_1';
        var filterId = '_design/' + filterVersion;  
        var filterName =  filterVersion + "/dist";
        var filter = {
            _id: filterId,
            filters: {
                dist: function(doc) {
                    return (doc.fdoo__ir_model == 'fpos.order' && doc.state == 'draft' && doc.place_id);
                }.toString()
            }                
        };
        
        // start sync
        var createSync = function() {
            var sync = PouchDB.sync(self.getDatabaseName(), destDB, {
                live: true,
                retry: true, 
                filter: filterName
            }).on('change', function(info) {
                Ext.Viewport.fireEvent('syncChange', info);
                self.notifySyncState('change');  
            }).on('error', function(err) {
                self.notifySyncState('error');  
            }).on('paused', function(err) {
               if ( err ) {
                 self.notifySyncState('error');  
               } else {
                 self.notifySyncState('paused');
               }               
            }).on('active', function() {
               self.notifySyncState('active');
            }).on('complete', function() {
                self.notifySyncState('complete');
            }).on('denied', function() {
               self.notifySyncState('error');
            });
            
            syncHandlers.push(sync);
            deferred.resolve(sync);   
        };      
        
        // check remote filter
        var checkRemoteFilter = function() {           
            destDB.get(filterId).then(function(res) {
                createSync();
            })['catch'](function(err) {
                if ( err.name == 'not_found' ) {
                    destDB.put(filter).then(function(res) {
                        createSync();  
                    })['catch'](function(err) {
                        deferred.reject(err);
                    });                
                } else {
                    deferred.reject(err);
                }
            });
        };

        // check local filter        
        db.get(filterId).then(function(res) {
            checkRemoteFilter(); 
        })['catch'](function(err) {
            if ( err.name == 'not_found' ) {
                db.put(filter).then(function(res) {
                   checkRemoteFilter(); 
                })['catch'](function(err) {
                   deferred.reject(err);            
                });
            } else {
                deferred.reject(err);
            }
        });
        
        return deferred.promise();
    },
    
    cancelSync: function() {
        var self = this;
        // cancel active syncs
        if ( self.syncHandlers ) {
            Ext.each(self.syncHandlers, function(sync) {
                sync.cancel();
            });
        }
    },
    
    /**
     * setup remote connections
     */ 
    setupRemote: function() {
        var self = this;
        var deferred = Ext.create('Ext.ux.Deferred');
        var profile = self.getProfile();
        
        // cancel sync
        self.cancelSync();
         
        // create sync (if sync is configured)
        var setupSync = function() { 
            if ( !profile || Ext.isEmpty(profile.fpos_dist_ids) ) {            
                self.setSync(false);
                setTimeout(function() {
                    deferred.resolve();
                },0);             
            } else {        
                
                // create/start handlers
                self.setSync(true);       
                self.syncHandlers = [];
                
                var procCount = 0;
                var procNotify = function(err) {
                    procCount++;
                    if ( procCount >= profile.fpos_dist_ids.length ) {
                        if ( self.syncHandlers.length === 0 ) {
                            self.notifySyncState('error');
                            deferred.reject(err);
                        } else {
                            deferred.resolve();
                        }
                    }
                };
                
                Ext.each(profile.fpos_dist_ids, function(dest) {
                    self.addSync(self.syncHandlers, dest.name)
                            ['catch'](procNotify).then(procNotify);
                           
                    
                });
                
            }
        };

        // check hwproxy        
        if ( profile.iface_print_via_proxy ) {
            var proxyUrl = 'http://localhost:8045';
            var proxy = Ext.create('Fpos.core.HwProxy', { url: profile.proxy_ip || 'http://localhost:8045' });
            proxy.getStatus(function(hwstatus) {
                // setup sync
                window.PosHw = proxy;
                self.setHwStatus(hwstatus);                
                setupSync();
            }, function(err) {
                // error
                self.setHwStatus({ err : err });
                deferred.reject(err);
            });    
        
        } else {
            // setup without hwproxy
            setupSync();
        }

        return deferred.promise();
    },
    
    hasNumpad: function() {
        var hwstatus = this.getHwStatus();
        return hwstatus.numpad;
    },
    
    hasPrinter: function() {
        var hwstatus = this.getHwStatus();
        return hwstatus.printer && hwstatus.printer.installed; 
    },
    
    printHtml: function(html) {
        if ( this.hasPrinter() ) {
            window.PosHw.printHtml(html);
        }          
    },
    
    getPrinters: function() {        
        var self = this;
        if ( self.printer === undefined ) {   
            self.printer = [];             
            var printerProfiles = self.getProfile().fpos_printer_ids;
            if ( printerProfiles && printerProfiles.length >= 0 ) {
                Ext.each(printerProfiles, function(profile) {
                    self.printer.push(Ext.create('Fpos.core.Printer', {'profile': profile}));
                });
            }
        }
        return self.printer;
    },
    
    hasPrinters: function() {
        return this.getPrinters().length > 0;
    },
    
    hasDisplay: function() {
        var hwstatus = this.getHwStatus();
        return hwstatus.display && hwstatus.display.installed;
    },
    
    displayFullCharset: function() {
       var hwstatus = this.getHwStatus();
        return hwstatus.display && hwstatus.display.fullcharset;
    },    
    
    display: function(lines) {
        if ( this.hasDisplay() ) {
             window.PosHw.display(lines);
        }
    },
 
    hasScale: function() {
        var hwstatus = this.getHwStatus();
        var profile = this.getProfile();
        return hwstatus && profile && profile.iface_electronic_scale && hwstatus.scale && hwstatus.scale.supported;
    },
    
    scaleInit: function(price, tara) {
        var self = this;
        var deferred = Ext.create('Ext.ux.Deferred');
        if ( self.hasScale() ) {
            window.PosHw.scaleInit(price, tara, function(result) {
                deferred.resolve(result);
            }, function(err) {
                deferred.reject(err);
            });
        } else {
            setTimeout(function() {
                deferred.reject({ name : "Unsupported",
                                  message: "Scale not supported!"});
            }, 0);
        }
        return deferred.promise();
    },
    
    scaleRead: function() {
        var self = this;
        var deferred = Ext.create('Ext.ux.Deferred');
        if ( self.hasScale() ) {
            window.PosHw.scaleRead(function(result) {
                deferred.resolve(result);
            }, function(err) {
                deferred.reject(err);
            });
        } else {
            setTimeout(function() {
                deferred.reject({ name : "Unsupported",
                                  message: "Scale not supported!"});
            }, 0);
        }
        return deferred.promise();
    },
 
    applyLog: function(store) {
        if (store) {
            if ( !store ){
                Ext.Logger.warn("The specified store cannot be found", this);
            }
        }
        return store;
    },
      
    formatSeq: function(seq) {
        var profile = this.getProfile();
        var seqStr = Ext.util.Format.leftPad(seq.toString(), profile.sequence_id.padding, '0');
        if ( profile.fpos_prefix ) {
            seqStr =  profile.fpos_prefix + seqStr; 
        }
        return seqStr;
    },
      
    updateProfile: function(profile) {
        var self = this;
        var users = {};        
        if (profile) {
            var journalById = self.getJournalById();
            // set cash journal
            Ext.each(profile.journal_ids, function(journal) {
                journalById[journal._id] = journal;
                if ( journal.type == 'cash') {
                    self.setCashJournal(journal); 
                }
            }); 
            
            // set users
            Ext.each(profile.user_ids, function(user) {
                users[user._id] = user; 
            });
        }       
        self.setUsers(users);
    },
    
    getUserById: function(userId) {
        if ( userId ) {
            var users = this.getUsers();
            if ( users ) return users[userId];
        }
        return undefined;
    },
    
    getUserName: function(userId) {
        var user = this.getUserById(userId);
        if ( user ) return user.name;
        return '';
    },
    
    getJournal: function(journal_id) {
        var journalById = this.getJournalById();
        if ( journalById ) {
            return journalById[journal_id];
        }
        return null;  
    },
      
    getDB: function() {
        var db = DBUtil.getDB(this.getDatabaseName());
        return db;
    },
    
    newClient: function() {
        var settings = this.getSettings();
        if (!settings) {
            throw {
                name : "No Settings",
                message: "No settings to create a client"
            };
        }
            
        var client = Ext.create('Ext.client.OdooClient', {
            "host" : settings.host,
            "port" : settings.port,
            "database" : settings.database,
            "login" : settings.login,
            "password" : settings.password            
        });
        
        return client;
    },
    
    updateApp: function() {
        if ( typeof(cordova) == 'undefined' || cordova.platformId !== 'android')
            return false;
            
        var self = this;
        var apkUrl = self.getApkUrl();
        var defaultError =  {
           name : "Download fehlgeschlagen!",
           message: "Datei " + apkUrl + " konnte nicht geladen werden"
        };
        
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
           fileSystem.root.getFile('download/fpos.apk', {
               create: true,
               exclusive: false
           }, function(fileEntry) {
               
               var localPath = fileEntry.toURL();
               var fileTransfer = new FileTransfer();
               
               ViewManager.startLoading("Download...");
               
               fileTransfer.download(apkUrl, localPath, function(entry) {
                       window.plugins.webintent.startActivity({ 
                           action: window.plugins.webintent.ACTION_VIEW,
                           url:  'file://' + entry.toURL(),
                           type: 'application/vnd.android.package-archive'
                       },
                       function() {
                           ViewManager.stopLoading();
                       },
                       function(err) {
                           ViewManager.stopLoading();
                           ViewManager.handleError(err, defaultError);
                       }
                    );                  
                }, function(err) {
                    ViewManager.stopLoading();
                    ViewManager.handleError(err, defaultError);
                });
           }, function(err) {
               ViewManager.stopLoading();
               ViewManager.handleError(err, defaultError);
           });
        }, function(err) {
            ViewManager.stopLoading();
            ViewManager.handleError(err, defaultError);
        });
        
        return true;        
    },
    
    downloadApk: function(apkFile) {
        if ( typeof(cordova) == 'undefined' || cordova.platformId !== 'android')
            return false;
            
        var self = this;
        var apkUrl = self.getDownloadUrl() + '/' + apkFile;
        var defaultError =  {
           name : "Download fehlgeschlagen!",
           message: "Datei " + apkUrl + " konnte nicht geladen werden"
        };
        
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
           fileSystem.root.getFile('download/' + apkFile, {
               create: true,
               exclusive: false
           }, function(fileEntry) {
               
               var localPath = fileEntry.toURL();
               var fileTransfer = new FileTransfer();
               
               ViewManager.startLoading("Download...");
               
               fileTransfer.download(apkUrl, localPath, function(entry) {
                       window.plugins.webintent.startActivity({ 
                           action: window.plugins.webintent.ACTION_VIEW,
                           url:  'file://' + entry.toURL(),
                           type: 'application/vnd.android.package-archive'
                       },
                       function() {
                           ViewManager.stopLoading();
                       },
                       function(err) {
                           ViewManager.stopLoading();
                           ViewManager.handleError(err, defaultError);
                       }
                    );                  
                }, function(err) {
                    ViewManager.stopLoading();
                    ViewManager.handleError(err, defaultError);
                });
           }, function(err) {
               ViewManager.stopLoading();
               ViewManager.handleError(err, defaultError);
           });
        }, function(err) {
            ViewManager.stopLoading();
            ViewManager.handleError(err, defaultError);
        });
        
        return true;        
    },
    
    provisioning: function() {
        if ( !wallpaper )
            return;
            
        // hardware provisioning
        if ( window.PosHw ) {
            window.PosHw.provisioning();
        }
            
        // background provisioning
        var self = this;
        var wallpaperUrl = self.getWallpaperUrl();
        wallpaperUrl += futil.physicalScreenWidth().toString() + "x" + futil.physicalScreenHeight().toString() + ".png";
        
        wallpaper.setImage(wallpaperUrl, "oerp-wallpaper-android", "FposImages", 
            function() {},
            function(err) {
                ViewManager.handleError(err, {
                    name: 'Fehler',
                    message: 'Hintergrund kann nicht gesetzt werden'
                });
            });
    },
    
    queryLastOrder: function() {
        // draft doc has sequence 0, therefore start from 1
        return DBUtil.search(this.getDB(), ['fdoo__ir_model', 'seq'], {
            descending: true,
            include_docs: true,
            inclusive_end: true,
            limit: 1,
            startkey: ['fpos.order', Number.MAX_VALUE],
            endkey: ['fpos.order', 1]
        });
    },
    
    queryLastCashState: function() {
        // draft doc has sequence 0, therefore start from 1
        return DBUtil.search(this.getDB(), ['fdoo__ir_model', 'tag', 'seq'], {
            descending: true,
            include_docs: true,
            inclusive_end: true,
            limit: 1,
            startkey: ['fpos.order', 's', Number.MAX_VALUE],
            endkey: ['fpos.order', 's', 1]
        });        
    },
    
    queryOrders: function() {
        var self = this;
        var deferred = Ext.create('Ext.ux.Deferred');
        self.queryLastCashState()['catch'](function(err) {
            deferred.reject(err);        
        }).then(function(res) {
            // draft doc has sequence 0, therefore start from 1
            var startSeq = res.rows.length > 0 ? res.rows[0].doc.seq : 1;
            DBUtil.search(self.getDB(), ['fdoo__ir_model', 'seq'], {
                include_docs: true,
                inclusive_end: true,
                startkey: ['fpos.order', startSeq],
                endkey: ['fpos.order', Number.MAX_VALUE]
            })['catch'](function(err) {
                deferred.reject(err);
            }).then(function(res) {
                var orders = [];
                Ext.each(res.rows, function(row) {
                   orders.push(row.doc); 
                });
                deferred.resolve(orders);   
            });                   
        });
        return deferred.promise();
    },
    
    isMobilePos: function() {
        var phyWidth = futil.physicalScreenWidth();
        return futil.screenWidth() < 600 || (phyWidth > 600 && phyWidth < 1024);
    },
    
    isPhonePos: function() {
        return futil.screenWidth() < 528;
    },
    
    openCashDrawer: function() {
        if ( window.PosHw ) {
            return window.PosHw.openCashDrawer();            
        }
        return false;
    }
    
});
