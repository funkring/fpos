/*global Ext:false,PouchDB:false*,openerplib:false,console:false*/

Ext.define('Ext.proxy.PouchDBUtil',{
    alternateClassName: 'DBUtil',
    
    singleton: true,
    
    config: {
    },
                
    constructor: function(config) {
        this.callParent(arguments);
        this.databases = {};
    },
        
    /**
     * @return database
     */
    getDB: function(dbName) {    
        var self = this;
        var db = this.databases[dbName];
        if ( !db ) {
            /*
            db = new PouchDB(dbName, {size: 50,
                                      adapter: 'websql' });
            */     
                                            
            db = new PouchDB(dbName, { adapter: 'websql' });
            self.databases[dbName] = db;
        }
        return db;
    },  
    
    /**
     * @ return view build form domain
     */
    buildView: function(domain) {
      if (!domain) {
          return null;
      }
      
      var name = 'index';
      var keys = [];   
      var keyValues = [];
      var tupl, op, value, field;
      var foundKey;
                    
      for (var i=0; i<domain.length;i++) {
          tupl = domain[i];
          foundKey = false;
          
          if ( tupl.constructor === Array && tupl.length == 3) {
              field = tupl[0];
              op = tupl[1];
              value = tupl[2];   
              name = name + "_" + field;
                              
              if ( op === '=') {         
                  keys.push(field);      
                  keyValues.push(value || null);     
                  foundKey = true;                                    
              }
          } 
          
          if ( !foundKey ) {
              continue;
          }
      }
      if ( keys.length === 1) {
          return {
              name: name,
              key: keyValues[0] || null,
              index: {
                map: "function(doc) { \n"+
                     "  if (doc." + keys[0] + ")  { \n" +
                     "    emit(doc." + keys[0]+"); \n" +
                     "  } else { \n" +
                     "    emit(null); " +
                     "  }" +
                     "}"
              }                    
          };
      } else if ( keys.length > 0 ) {
          var fct = "function(doc) { \n" +
                    "  var key = [];\n";
                    
          for ( var keyI=0; keyI < keys.length; keyI++) {
             fct +=
               "  if (doc." + keys[keyI] + ")  { \n" +
               "    key.push(doc." + keys[keyI]+"); \n" +
               "  } else { \n" +
               "    key.push(null); \n" +
               "  } \n" +
               "  \n";               
          }
          
          fct += "  emit(key);\n";
          fct += "}\n";
          
          return {
              name: name,
              key: keyValues,
              index: {
                map: fct
              }       
          };
      }

      return null;
    },  
    
    search: function(db, domain, params, callback) {    
        var self = this;
        var view = self.buildView(domain);
        
        if (view !== null) {
            params.key = view.key;
            return db.query(view.name, params, function(err, res) {                
                if ( !err ) {
                    // no error result was successfull
                    if (callback) {
                        callback(err, res);
                    }
                } else {
                    //create view doc
                    var doc = {
                        _id: "_design/" + view.name,
                        views: {                            
                        }
                    };
                    doc.views[view.name]=view.index;
                    //put doc
                    db.put(doc, function(err, res) {
                        if (err) {
                            // error on create index
                            if (callback) {
                                callback(err, null);
                            }
                        } else {
                            // query again
                            db.query(view.name, params, callback);
                        }
                    });          
                }
                    
            });       
        } else {
           return db.allDocs(params, callback);
        } 
    },
    
    /**
     * search all parents
     */
    findParents: function(db, parent_uuid, callback, parent_list) {
        var self = this;
        
        if ( !parent_list ) {
            parent_list = [];
        }
        
        // check not found
        if ( !parent_uuid ) {
            callback(null,null);
            return;
        }
        
        db.get(parent_uuid).then(function(doc) {
            parent_list.push(doc);
            if ( doc.parent_id ) {
                self.findParents(db, doc.parent_id, callback, parent_list);
            } else {
                callback(null, parent_list);
            }
        }).catch(function(err) {
            callback(err);
        });      
    },
    
    /**
     * search first child where the passed domain match
     * also search up in the parent tree
     */
    findFirstChild: function(db, parent_uuid, parent_field, domain, callback) {    
        var self = this;        
        
        // check not found
        if ( !parent_uuid ) {
            callback(null,null);
            return;
        }
        
        var searchDomain =  [["parent_id","=",parent_uuid]];
        if ( domain ) {            
            searchDomain = searchDomain.concat(domain);
        }
        
        self.search(db, searchDomain, {'include_docs':true}, function(err, res) {
             if ( !err && res ) {
                 if ( res.rows.length > 0 ) {
                     callback(null, res.rows[0].doc);
                 } else {
                     db.get(parent_uuid).then(function(doc) {                     
                         self.findFirstChild(db, doc[parent_field], parent_field, domain, callback);
                     }).catch(function(err) {
                        callback(err); 
                     });
                 }
            } else {
                callback(err);
            }
        });
    },
    
    /**
     * deep data copy (without _id and _rev)
     */
    createClone: function(data) {
          if ( !data ) 
            return data;
                        
          var dumps = JSON.stringify(data, function(key, value) {
             if (key == '_id') {
                 return undefined;
             } else if ( key == '_rev') {
                 return undefined;
             } else if ( key == 'create_uid') {
                 return undefined;
             } else if ( key == 'write_uid') {
                return undefined;
             } else {
                 return value;
             }             
          });
          return JSON.parse(dumps);
          
    },
    
    cascadeDelete: function(db, parent_uuid, parent_field, callback) {       
        var self = this;
        
        var opCount=1;
        var opCallback = function(err,res) {
            if ( --opCount === 0) {
                if (callback) {
                    callback(err,res);
                }
            }
        };
        
        var searchDelete = function(uuid) {
            self.search(db, [[parent_field,"=",uuid]], {'include_docs':true}, function(err, res) {
                 if (!err) {                    
                    opCount += res.rows.length;
                    Ext.each(res.rows, function(row) {
                        db.remove(row.doc, {}, function(err, res) {
                            searchDelete(row.doc._id);                            
                        });                        
                    });
                 }
                 opCallback(err,res);
            });
        }; 

        searchDelete(parent_uuid);     
    },
    
    deepChildCopy: function(db, new_parent_uuid, template_uuid, parent_field, defaults, callback ) {
        var self = this;
        self.search(db, [[parent_field,"=",template_uuid]], {'include_docs':true}, function(err, res) {
            if ( err ) {
                callback(err);
            } else {
                var rows = res.rows;
                
                var operationCount = rows.length+1;
                var operationCallback = function(err, res) {
                    if ( --operationCount === 0 ) {
                        callback(err, res);
                    }
                };
                
                Ext.each(rows, function(row) {
                   // prepare copy
                   var template_child_uuid = row.doc._id;
                   var child = row.doc;
                   delete child._id;
                   delete child._rev;
                   child[parent_field]=new_parent_uuid;
                   
                   // copy defaults
                   if ( defaults ) {                    
                       for ( var key in defaults) {
                           child[key] = defaults[key];
                       }
                   }
                   
                   // create copy
                   db.post(child, function(err, res) {
                        if ( !err ) {
                            self.deepChildCopy(db, res.id, template_child_uuid, parent_field, defaults, operationCallback);
                        } else {
                            operationCallback(err, res);
                        }               
                   });       
                });
                
                operationCallback(err, res);
            }
        });
    },
    
    resetDB: function(dbName, callback) {
        var self = this;
        var db = self.getDB(dbName);        
        delete self.databases[dbName];
        db.destroy(callback);
    },


    resetSync: function(dbName, callback) {
        var self = this;
        var db = self.getDB(dbName);
        
        db.get("_local/odoo_sync", function(err, doc) {
            if ( !err ) {
                db.remove(doc,function(err) {
                    callback(err);            
                });
            } else {
                callback();    
            }
        });        
    },
    
     /**
     * sync odoo store
     */
    syncOdooStore: function(config, con, db, store, syncUuid, res_model, domain, view, log, callback) {        
        var syncName = syncUuid+"-{"+res_model+"}";
        if ( domain ) {
            syncName = syncName + "-{"+JSON.stringify(domain)+"}";
        }
        
        var jdoc_obj = con.get_model("jdoc.jdoc");
        
        // delete docs
        
        // download docs
        
        // load changes
        
        // publish change
        
        // fetch changes
        var syncChanges = function(syncPoint) {
            db.changes({
                include_docs: true,
                since: syncPoint.seq,
                filter: function(doc) {
                    return doc.fdoo__ir_model === res_model;
                }
            }).then(function(changes) {
                var fields =  store.getModel().getFields().keys;
                jdoc_obj.exec("jdoc_sync", 
                     [
                       {
                        "model" : res_model,
                        "domain" : domain,
                        "view": view, 
                        "fields" : fields,
                        "lastsync" : syncPoint,
                        "changes" : changes.results || {},
                        "actions" : config.actions || []                      
                       },
                       con.user_context
                     ],                       
                     null, 
                     function(err, res) {
                         if ( err ) {                                                             
                             callback(err);
                         } else {
                             var server_changes = res.changes;
                             var server_lastsync = res.lastsync;
                             var pending_server_changes = server_changes.length+1;
                             
                             var docDeleted = 0;
                             var docUpdated = 0;
                             var docInserted = 0;
                                                          
                             var serverChangeDone = function(err) {
                                if ( err ) {
                                    log.warning(err);
                                }
                                
                                if ( --pending_server_changes === 0) {
                                    // update sync data                                   
                                    db.info().then(function(res) {
                                        server_lastsync.seq = res.update_seq;
                                        db.get("_local/odoo_sync", function(err, doc) {
                                           
                                           // new sync point 
                                           if (err) {
                                              doc={_id: "_local/odoo_sync"};
                                           } 
                                           
                                           // log statistik
                                           log.info("Synchronisation für <b>" + res_model + "</b> ausgeführt </br> " +
                                                    "<pre>" + 
                                                    "    " + docDeleted + " Dokumente gelöscht" +
                                                    "    " + docInserted + " Dokumente eingefügt" +
                                                    "    " + docUpdated + " Dokumente aktualisiert" +
                                                    "</pre>");
                                           
                                           doc[syncName]=server_lastsync;
                                           db.put(doc, function(err) {                                              
                                               callback(err, server_lastsync);                                               
                                           });
                                           
                                        });
                                    });           
                                }                              
                                 
                             };
                             
                             // iterate changes
                             Ext.each(server_changes, function(server_change) {
                                // handle delete
                                if ( server_change.deleted ) {
                                    
                                    // lösche dokument
                                    db.get(server_change.id, function(err, doc) {
                                         if ( !err ) {
                                            doc._deleted=true; 
                                            docDeleted++;                                         
                                            //log.info("Dokument " + server_change.id + " wird gelöscht");
                                            db.put(doc, serverChangeDone); //<- decrement pending operations
                                         } else {
                                            //log.warning("Dokument " + server_change.id + " nicht vorhanden zu löschen");
                                            // decrement operations
                                            serverChangeDone(); 
                                         }                                      
                                    });
                                    
                                //handle update
                                } else if ( server_change.doc ) {
                                    db.get(server_change.id, function(err, doc) {
                                         if ( err ) {
                                             docInserted++;
                                             //log.warning("Dokument " + server_change.id + " wird neu erzeugt");
                                         } else {
                                             docUpdated++;                                         
                                             server_change.doc._rev = doc._rev;
                                             //log.info("Dokument " + server_change.id + " wird aktualisiert");
                                         }
                                         db.put(server_change.doc, serverChangeDone); //<- decrement pending operations                                         
                                    });
                                }
                             });
                             
                             // changes done
                             serverChangeDone();
                         }
                     });                                
            }).catch(function(err) {
                callback(err);
            });
        };
        
        
        // get last syncpoint or create new
        db.get("_local/odoo_sync", function(err, doc) {
            var syncpoint;
             
            if (!err) {
                syncpoint = doc[syncName];
            }
            
            if ( !syncpoint ) {
                syncpoint = {
                    "date" : null,
                    "sequence" : 0
                };
            }
            
            syncChanges(syncpoint);     
            
        });
      
    },
    
    /**
     * sync with odoo
     */
    syncOdoo: function(config, log, callback) {
         var self = this;
         //credential, stores,
         
         var con = openerplib.get_connection(config.access.host, 
                                            "jsonrpc", 
                                            parseInt(config.access.port,10), 
                                            config.access.db, 
                                            config.access.user, 
                                            config.access.password);
                           
         var syncuuid = "odoo_sync_{"+config.access.user + "}-{" + config.access.host + "}-{" + config.access.port.toString() + "}-{" + config.access.user +"}";
                 
         if ( !log ) {
             log = function() {
                 this.log = function(message) {
                     console.log(message);
                 };
                 this.error = this.log;
                 this.warning = this.log;
                 this.debug = this.log;
                 this.info = this.log;
             };
         }
        
         // prepare store sync
         var syncStore = function(store, callback) {
            var proxy = store.getProxy();
            if ( proxy instanceof Ext.proxy.PouchDB ) {
                // get model and domain  
                var res_model = proxy.getResModel();
                var domain = proxy.getDomain();
                var view = proxy.getView();
                // can only sync with model                
                if ( res_model) {
                    // get database                    
                    var db = self.getDB(proxy.getDatabase());
                    // sync odoo store
                    self.syncOdooStore(config, con, db, store, syncuuid, res_model, domain, view, log, function(err, res) {
                        callback(err, res);
                    });
                } else {                    
                    log.error("Kein resModel für Store " + Ext.getClass(store).getName() + " gesetzt!");
                    callback();
                }
            }
         };
        
                     
         // start sync                    
         con.authenticate( function(err)  {
             if (err) {
                 callback(err);
             } else {
                 log.info("Authentifizierung erfolgreich");       
                 
                 var storeIndex = -1;
                 var storeLength = config.stores.length;
                 var lastError = null;
                 
                 // handle stores
                 var storeCallback = function(err, res) {
                     if (err) {
                         lastError = err;
                     }
                                      
                     if ( ++storeIndex < storeLength ) {
                        syncStore(config.stores[storeIndex], storeCallback);
                     } else {
                        callback(lastError, res);                            
                     }
                 };
                 
                 storeCallback();
                    
             }
         } );
        
    }
    
});