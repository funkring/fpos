/*global Ext:false,PouchDB:false*,openerplib:false,futil:false,URI:false*/

Ext.define('Ext.proxy.PouchDBUtil',{
    alternateClassName: 'DBUtil',
    requires: [    
        'Ext.ux.Deferred'
    ],
    
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

    syncWithOdoo: function(db, client, sync_config) {
        var deferred = Ext.create('Ext.ux.Deferred');
        // invoke before sync
        client.invoke("jdoc.jdoc","jdoc_couchdb_before",[sync_config])
            .then(function(couchdb_config) {
                
                // get couchdb link
                var password = client.getClient()._password;                                
                var target_url = URI(couchdb_config.url)
                    .username(couchdb_config.user)
                    .password(password)
                    .toString()+couchdb_config.db;
                                
                // sync
                db.sync(target_url)
                    .then(function(sync_res) {
                        // invoke after sync
                        client.invoke("jdoc.jdoc","jdoc_couchdb_after",[sync_config]) 
                            .then(function(couchdb_config) {
                                deferred.resolve(sync_res);
                            }).catch(function(err) {
                                deferred.reject(err);
                            });
                                                   
                    }).catch(function(err) {
                        deferred.reject(err); 
                    });
            }).catch(function(err) {
                deferred.reject(err);               
            });

        return deferred.promise();
    }
    
});