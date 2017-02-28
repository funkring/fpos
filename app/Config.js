/*global Ext:false, futil:false, DBUtil:false, LocalFileSystem:false, FileTransfer:false, ViewManager:false, wallpaper:false, cordova:false, PouchDB:false, console:false */

Ext.define('Fpos.Config', {
    singleton : true,
    alternateClassName: 'Config',
    requires: [
        'Ext.proxy.PouchDBUtil',
        'Ext.data.proxy.Odoo',       
        'Ext.store.LogStore',
        'Ext.client.OdooClient',
        'Ext.ux.Deferred',
        'Ext.util.Format',
        'Ext.form.ViewManager',
        'Fpos.core.Printer',
        'Fpos.core.HwProxy',        
        'Fpos.model.OPartner'
    ],
    config : {       
        version : '5.0.3',
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
        wallpaperUrlPrefix: "http://downloads.oerp.at/oerp_android_wallpaper_",
        apkUrl: "http://downloads.oerp.at/fpos_4.apk",
        downloadUrl: "http://downloads.oerp.at",
        provUrl: "http://downloads.oerp.at/fpos.json",
        qtyDecimals: 3,
        hwStatus: { err: null },
        cashJournal: null,
        sync: false,
        syncState: 'idle',
        syncVersion: 0,
        highestSyncVersion: 0,
        lowestSyncVersion: 0,        
        syncHandlers: null,
        logoutCode: '0000000',
        journalById: {},
        posClosed: false
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
    
    getSyncFilter: function() {
        var filterVersion = 'fpos_v5';
        var filterId = '_design/' + filterVersion;  
        var filterName =  filterVersion + "/dist";
        var version = this.getHighestSyncVersion();
        return {
            name: filterName,  
            filter : {
                _id: filterId,
                version: version,       
                filters: {
                    dist: function(doc) {
                        return (doc._id == 'fpos_config' || (doc.fdoo__ir_model == 'fpos.order' && doc.state == 'draft' && doc.place_id && doc.sv >= '$sync_version'));
                    }.toString().replace('$sync_version', version)
                }
            }
        };
    },
    
    addLocalSyncFilter: function() {
     
        var deferred = Ext.create('Ext.ux.Deferred');
        var self = this;
        var data = self.getSyncFilter();
        var db = self.getDB();
        
         // check local
        db.get(data.filter._id).then(function(res) {
            // check for local filter update
            if ( !res.version || res.version != data.filter.version) {
                data.filter._rev = res._rev;                      
                db.put(data.filter).then(function(res) {
                    deferred.resolve();
                })['catch'](function(err) {
                    deferred.reject(err);
                });
            } else {                
                deferred.resolve();
            } 
        })['catch'](function(err) {
            if ( err.name == 'not_found' ) {
                db.put(data.filter).then(function(res) {
                   deferred.resolve();
                })['catch'](function(err) {
                   deferred.reject(err);        
                });
            } else {
                deferred.reject(err);
            }
        });
        
        return deferred.promise();
    },
    
    addSync: function(syncHandlers, destDB, test, setupOnly) {
        var deferred = Ext.create('Ext.ux.Deferred');
        var self = this;
        var db = self.getDB();
        var data = self.getSyncFilter();
        
        // start sync
        var createSync = function() {
            if ( !setupOnly ) {
                var sync = PouchDB.sync(self.getDatabaseName(), destDB, {
                    live: true,
                    retry: true, 
                    filter: data.name
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
            }
            deferred.resolve();
        };      
                
        // update config
        var updateConfig = function(fpos_config) {
                        
            if ( !fpos_config ) {
                fpos_config =  { _id: 'fpos_config' };
            }
            
            var sv = self.getHighestSyncVersion();            
            if ( fpos_config.sv != sv ) {
                // update config
                fpos_config.sv = sv;
                destDB.put(fpos_config).then(function() {
                    createSync();
                })['catch'](function(err) {
                    deferred.reject(err);
                });
            } else {
                // no update necessary
                createSync();
            }
        };
        
        // check config 
        var checkConfig = function() {
            destDB.get("fpos_config").then(function(fpos_config) {
                updateConfig(fpos_config);
            })['catch'](function(err) {
                if ( err.name == 'not_found') {
                    updateConfig(null);
                } else {
                    deferred.reject(err);
                }
            });    
        };
        
        // check remote filter        
        destDB.get(data.filter._id).then(function(res) {                
            if ( test ) {
                deferred.resolve(res);
            } else {
                checkConfig();
            }             
        })['catch'](function(err) {
            if ( err.name == 'not_found' ) {
                if ( test ) {
                    deferred.resolve(null);
                } else {
                    destDB.put(data.filter).then(function(res) {
                        checkConfig();                          
                    })['catch'](function(err) {
                        deferred.reject(err);
                    });                
                }
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
    
    getRemoteDatabases: function() {
        // create destination databases
        var destDatabases = [];
        // only create databases
        // if sync is active
        if ( this.getSync() ) {   
            var profile = this.getProfile(); 
            if ( !Ext.isEmpty(profile.fpos_dist_ids)  ) {            
                Ext.each(profile.fpos_dist_ids, function(dest) {            
                    if (dest.name) destDatabases.push(new PouchDB(dest.name));
                });
            }
        }
        return destDatabases;
    },
        
    setupRemoteLinks: function(destDatabases, test, setupOnly) {
        // vars
        var self = this;
        var deferred = Ext.create('Ext.ux.Deferred');
        var profile = self.getProfile();
        
         // cancel sync
        self.cancelSync();
        
        if ( destDatabases.length === 0 ) {
            setTimeout(function() {
                deferred.resolve();
            },0);             
        } else {        
            
            // create/start handlers            
            self.syncHandlers = [];

            var nodeCount = 0;
            var nodeErr = null;
            var lowestSyncVersion = self.getLowestSyncVersion();
            var highestSyncVersion = self.getHighestSyncVersion();
            
            var procNotify = function(err, res) {
                nodeCount++;                                
                if ( err ) {
                    if ( !nodeErr ) nodeErr = err;
                } 
                // determine lowest version
                else if ( test ) {                    
                    if ( res && res.version ) {
                        if  (res.version < lowestSyncVersion) {
                            lowestSyncVersion = res.version;
                        } 
                        if (res.version > highestSyncVersion) {
                            highestSyncVersion = res.version;
                        }                         
                    }
                }
                
                if ( nodeCount >= destDatabases.length ) {
                    if ( test ) {
                        // update sync version range
                        self.setLowestSyncVersion(lowestSyncVersion);
                        self.setHighestSyncVersion(highestSyncVersion);
                        console.log("LowestSyncVersion: " + lowestSyncVersion);
                        console.log("HighestSyncVersion: " + highestSyncVersion);
                        deferred.resolve();
                    } else {
                        if ( nodeErr ) {
                            self.notifySyncState('error');
                            deferred.reject(nodeErr);
                        } else {                                            
                            deferred.resolve();
                        }
                    }
                }
            };
                
             
            if ( test ) {
                // add remote links
                Ext.each(destDatabases, function(destDB) {
                    self.addSync(self.syncHandlers, destDB, test, setupOnly).then(function(res) {
                        procNotify(null, res);
                    }, function(err) {
                        procNotify(err, null);
                    });
                });
            } else {
                // add localfilter     
                self.addLocalSyncFilter().then(function() {
                    // add remote links
                    Ext.each(destDatabases, function(destDB) {
                        self.addSync(self.syncHandlers, destDB, test, setupOnly).then(function(res) {
                            procNotify(null, res);
                        }, function(err) {
                            procNotify(err, null);
                        });
                    });
                }, function(err) {
                    deferred.reject(err);
                });           
                
            }
            
        }
        
        return deferred.promise();
    },
    
    /**
     * setup remote databases
     */
    setupRemoteDatabases: function() {      
        var self = this;
        var destDatabases = self.getRemoteDatabases();
        if ( destDatabases.length > 0) {
            return self.setupRemoteLinks(destDatabases, false, true);
        } else {
            var deferred = Ext.create('Ext.ux.Deferred');
            setTimeout(function() {
                deferred.resolve();
            }, 0);
            return deferred.promise();
        }
    },
    
    /**
     * setup remote connections
     */ 
    setupProxy: function() {
        var self = this;
        var deferred = Ext.create('Ext.ux.Deferred');
        var profile = self.getProfile();
              
        // check hwproxy        
        if ( profile.iface_print_via_proxy ) {
            var proxyUrl = 'http://localhost:8045';
            var proxy = Ext.create('Fpos.core.HwProxy', { url: profile.proxy_ip || 'http://localhost:8045' });
            proxy.getStatus(function(hwstatus) {
                // setup proxy
                window.PosHw = proxy;
                self.setHwStatus(hwstatus);
                // finished  
                deferred.resolve();              
            }, function(err) {
                // error
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
        var sync = false;  
        if (profile) {
            // set sync version
            var syncVersion = profile.fpos_sync_version ? profile.fpos_sync_version : 1;
            console.log("Profile->fpos_sync_version: " + syncVersion);
            self.setSyncVersion(syncVersion);
            self.setHighestSyncVersion(syncVersion);
            self.setLowestSyncVersion(syncVersion);
            
            // set cash journal
            var journalById = self.getJournalById();            
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
            
            // enable sync
            sync = (profile.fpos_dist_ids && profile.fpos_dist_ids.length > 0);
            
        }       
        self.setSync(sync);
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
    
    buildUrl: function(path) {
        if ( !this.baseUrl ) {
            var settings = this.getSettings();
            if (settings) {
                var url = settings.port != 443 ? 'http://' : 'https://';         
                url = url + settings.host;    
                if ( settings.port && settings.port != 80 && settings.port != 443) {
                    url = url + ':' + settings.port.toString();
                }                
                this.baseUrl = url;
            } else {
                this.baseUrl = '/';
            }
        }
        
        if ( path ) {
            return this.baseUrl + '/' + path;
        }
        
        return this.baseUrl;
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
    
    getClient: function() {
        var self = this;
        var deferred = Ext.create('Ext.ux.Deferred');
        if ( !self.client ) {
            var client = self.newClient();
            client.connect()['catch'](function(err) {
                deferred.reject(err);
            }).then(function() {
            
                // override client function
                Ext.define('Override.data.proxy.Odoo', {
                    override: 'Ext.data.proxy.Odoo',
                    getClient: function() {
                        return self.client.getClient();
                    }
                });
                
                self.client = client;
                deferred.resolve(self.client);
            });
        } else {
            setTimeout(function() {
                deferred.resolve(self.client); 
            },0);
        }
        return deferred.promise();
    },
    
    loadProv: function() {
        var self = this;
        var deferred = Ext.create('Ext.ux.Deferred');
        var req = new XMLHttpRequest();        
        
        req.open("GET", this.getProvUrl(), true);
        req.responseType = "json";
        
        req.onload = function() {
            var status = req.status;
            if ( status == 200 ) {                
                var provData = req.response;
                
                // config
                var prov =  {
                    wallpaperUrlPrefix: self.getWallpaperUrlPrefix(),
                    apkUrl: self.getApkUrl(),
                    downloadUrl: self.getDownloadUrl()
                };
                
                // override properties
                var overrideProperties = function(data) {                    
                    if ( data ) {                        
                        Ext.each(["wallpaperUrlPrefix",
                                  "wallpaperUrl",
                                  "apkUrl",
                                  "downloadUrl"], function(prop) {
                           if ( data[prop] ) prov[prop] = data[prop]; 
                        });
                        return true;
                    }
                    return false;                    
                };
                
                // override
                overrideProperties(provData);
                
                // check model specific
                var hwStatus = self.getHwStatus();
                if ( hwStatus ) {
                    var manufacturerData = null;
                    
                    // override manufacturer specific data 
                    if ( hwStatus.manufacturer ) {
                        manufacturerData = provData[hwStatus.manufacturer];
                        overrideProperties(manufacturerData);                        
                    }
                    
                    // override model specific data
                    if ( hwStatus.model ) {
                        overrideProperties(provData[hwStatus.model]);   
                        
                        // override manufacturer specific 
                        // model data
                        if ( manufacturerData ) {
                            overrideProperties(manufacturerData[hwStatus.model]);
                        }        
                    }
                    
                    
                }
                
                deferred.resolve(prov);
            } else {
                deferred.reject(status);
            }
        };
        
        req.send();
        return deferred.promise();
    },    
    
    updateApp: function() {
        if ( typeof(cordova) == 'undefined' || cordova.platformId !== 'android')
            return false;
       
        var self = this;
        self.loadProv().then(function(prov) {
        
            var defaultError =  {
               name : "Download fehlgeschlagen!",
               message: "Datei " + prov.apkUrl + " konnte nicht geladen werden"
            };
            
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
               fileSystem.root.getFile('download/fpos.apk', {
                   create: true,
                   exclusive: false
               }, function(fileEntry) {
                   
                   var localPath = fileEntry.toURL();
                   var fileTransfer = new FileTransfer();
                   
                   ViewManager.startLoading("Download...");
                   
                   fileTransfer.download(prov.apkUrl, localPath, function(entry) {
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
        }, function(err) {
            ViewManager.stopLoading();
            ViewManager.handleError(err, {"name":"provisioning",
                                          "message": "Provisioning konnte nicht geladen werden"});
        });
        
        return true;        
    },
    
    downloadApk: function(apkFile, prov) {
        if ( typeof(cordova) == 'undefined' || cordova.platformId !== 'android')
            return false;
            
        var self = this;
        
        self.loadProv().then(function(prov) {
            var apkUrl = prov.downloadUrl + '/' + apkFile;
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
        }, function(err) {
            ViewManager.stopLoading();
            ViewManager.handleError(err, {"name":"provisioning",
                                          "message": "Provisioning konnte nicht geladen werden"});
        });
        return true;        
    },
    
    provisioning: function(prov) {
        if ( !wallpaper )
            return;
            
        // hardware provisioning
        if ( window.PosHw ) {
            window.PosHw.provisioning();
        }
            
        // background provisioning
        var self = this;
        self.loadProv().then(function(prov) {
        
            // build url            
            var wallpaperUrl = prov.wallpaperUrl;
            if ( !wallpaperUrl) {
                wallpaperUrl = prov.wallpaperUrlPrefix + futil.physicalScreenWidth().toString() + "x" + futil.physicalScreenHeight().toString() + ".png";
            }
            
            // set wallpaper
            wallpaper.setImage(wallpaperUrl, "oerp-wallpaper-android", "FposImages", 
                function() {},
                function(err) {
                    ViewManager.handleError(err, {
                        name: 'Fehler',
                        message: 'Hintergrund kann nicht gesetzt werden'
                    });
                });
        }, function(err) {
            ViewManager.handleError(err, {"name":"provisioning",
                                          "message": "Provisioning konnte nicht geladen werden"});
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
       
    migrateDraftOrders: function() {
        var deferred = Ext.create('Ext.ux.Deferred');
        var self = this;
        var db = this.getDB();
        DBUtil.search(db, [['fdoo__ir_model','=','fpos.order'],['seq','=',0]], {
            include_docs: true
        }).then(function(res) {
            var orders = [];
            var version = self.getHighestSyncVersion();
            var countDelete = 0;
            var countMigrate = 0;
             
            // search order for migration
            Ext.each(res.rows, function(row) {                
                if ( row.doc.sv < version ) {
                    if ( row.doc.line_ids && row.doc.line_ids.length > 0 && (row.doc.sv+1 == version) ) {
                        countMigrate++;
                        row.doc.sv = version;
                    } else {
                        // delete empty
                        countDelete++;
                        row.doc._deleted = true;
                    }
                    orders.push(row.doc);    
                }                                 
            });
            
            console.log("migrateDraftOrders: " + countMigrate);
            console.log("deleteDraftOrders: " + countDelete);
                        
            if ( orders.length > 0 ) {
                // bulk update for all orders
                db.bulkDocs(orders).then(function() {
                    deferred.resolve();
                })['catch'](function(err) {
                    deferred.reject(err);
                });
            } else {
                deferred.resolve();
            }
            
        })['catch'](function(err) {
            deferred.reject(err);
        });
        
        deferred.promise();
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
        return futil.screenWidth() < 600;
    },
    
    isTabletPos: function() {
        var width = futil.screenWidth();
        return ( width > 600 && width < 1024 );        
    },
    
    isPhonePos: function() {
        return futil.screenWidth() < 528;
    },
    
    openCashDrawer: function() {
        if ( window.PosHw ) {
            return window.PosHw.openCashDrawer();            
        }
        return false;
    },
    
    hasQRScanner: function() {
        var hwstatus = this.getHwStatus();
        return hwstatus.scanner;
    },
    
    scanQR: function(callback) {
        /*
        setTimeout(function() {
            callback(null, {
                text: "BCD\n"+
                    "001\n"+
                    "1\n"+
                    "SCT\n"+
                    "STSPAT2GXXX\n" +
                    "Martin Reisenhofer\n"+
                    "AT532081519700011646\n" +
                    "EUR10.00\n"+
                    "\n"+
                    "AR2323"
            });
        }, 0);
        setTimeout(function() {
            callback(null, {
                text: "BCD\n"+
                    "001\n"+
                    "1\n"+
                    "SCT\n"+
                    "RZSTAT2G403\n" +
                    "Sabine Höllebauer\n"+
                    "AT443840300005013701\n" +
                    "EUR10.00\n"+
                    "\n"+
                    "AR1212"
            });
        }, 0);*/
        
        if ( this.hasQRScanner() ) {
            return window.PosHw.scan(function(result) {
                if (callback) callback(null, result);
            }, function(err) {
                if (callback) callback(err);
            });
        }
    },
    
    getOnlinePartner: function() {
        var profile = this.getProfile();
        return profile && profile.iface_ponline;
    },
    
    getPartnerModel: function() {
        return {
            model: 'res.partner',
            domain: [['available_in_pos','=',true]],
            ndomain: [['available_in_pos','=',true],['active','=',false]],            
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
        };
    },
    
    resetDist: function() {        
        var deferred = Ext.create('Ext.ux.Deferred');
        var self = this;
        
        var destDatabases = self.getRemoteDatabases();
        if ( destDatabases.length > 0 ) {
            
            var procCount = 0;
            var procErr = null;          
            var procNotify = function(err) {              
                procCount++;
                if (!procErr && err) procErr = err; 
                if ( procCount >= destDatabases.length ) {
                    if ( procErr ) {
                        deferred.reject(procErr);
                    } else {                        
                        deferred.resolve();
                    }
                }
            };
            
            Ext.each(destDatabases, function(distDB) {                                
                distDB.destroy().then(function() {                    
                    procNotify();
                })['catch'](function(err) {
                    procNotify(err);                    
                });
            });
            
        } else {
            setTimeout(function() {
                deferred.resolve();
            }, 0);
        }
        
        return deferred.promise();
    },
    
    resetDB: function() {
        var deferred = Ext.create('Ext.ux.Deferred');
        var self = this;
        var name = self.getDatabaseName();
        var db = self.getDB();
        var client = self.newClient();
        var settings = self.getSettings();
        
        // try connect
        client.connect()['catch'](function(err) {
            deferred.reject(err);
        }).then(function(res) {
            // reset database
            DBUtil.resetDB(name, function(err) {
                if ( !err ) {
                    // get new db
                    db = self.getDB();
                    // post config
                    delete settings._rev;             
                    db.post(settings)['catch'](function(err) {
                        deferred.reject(err);  
                    }).then(function(res) {
                        // reset odoo database and reload
                        DBUtil.resetOdoo(db, client, name)['catch'](function(err) {
                            deferred.reject(err);
                        }).then(function(res) {
                            deferred.resolve(res);
                        });
                    });
                } else {
                   deferred.reject(err);
                }
            });
        });        
        
        return deferred.promise();
    },
    
    restart: function() {
        this.cancelSync();
        setTimeout(function() {
            window.location.reload();   
        }, 1000);
    },

    /**
     * if not signing is active
     */
    signDisabled: function(signable) {
        var deferred = Ext.create('Ext.ux.Deferred');
        setTimeout(function() {
            deferred.resolve(signable);
        }, 0);
        return deferred.promise();
    },
    
    /**
     * if sign was not supported
     */
    signNotSupported: function(signable) {
        var deferred = Ext.create('Ext.ux.Deferred');
        setTimeout(function() {
            deferred.reject({
                name : "sign_not_supported",
                message : "Die konfigurierte Signierung wird nicht unterstützt"
            });
        }, 0);
        return deferred.promise();
    },
        
    /**
     * if card support, sign with hsm
     */
    signHsm: function(signable) {
        var deferred = Ext.create('Ext.ux.Deferred');
        var self = this;
        window.PosHw.sign(signable, function(res) {
           deferred.resolve(res);
        }, function(err) {
           // check if it is to initialize
           if ( typeof err === 'string' && err == 'no_init') {
               var profile = self.getProfile();
               window.PosHw.signInit(profile, function() {
                   // init successful, sign again
                   window.PosHw.sign(signable, function(res) {
                       deferred.resolve(res);
                   }, function(err) {
                       deferred.reject(err);
                   });
               }, function(err) {
                   // init reror
                   deferred.reject(err);
               });
           }  else {
               // forward error
               deferred.reject(err);
           }
        });
        return deferred.promise();
    },

    sign: function(signable) {
        if ( !this.signMethod ) {
            var profile = this.getProfile();
            if ( !profile || profile.sign_status != 'active' ) {
                this.signMethod = this.signDisabled;
            } else {
                this.signMethod = this.signNotSupported;
                if ( profile.sign_method == "card") {
                    var hwstatus = this.getHwStatus();
                    if ( hwstatus.cardreader ) {
                        this.signMethod = this.signHsm;
                    }                    
                }
            }
        }
        return this.signMethod(signable);
    },
        
    signQueryCert: function() {
        var deferred = Ext.create('Ext.ux.Deferred');
        var self = this;
        var profile = self.getProfile();
        var available = false;
        
        if ( profile ) {
            if ( profile.sign_method == "card" ) {
                var hwstatus = self.getHwStatus();
                if ( hwstatus.cardreader ) {
                    available = true;
                    window.PosHw.signQueryCert(function(res) {
                        deferred.resolve(res);
                    }, function(err) {
                        deferred.reject(err);
                    });
                }
            } 
        }
        
        if ( !available ) {
            setTimeout(function() {
                deferred.reject({
                    name : "cert_not_available",
                    message : "Kein Zertifikat vorhanden"
                });
            }, 0);
        }
        
        return deferred.promise();
    }
    
});
