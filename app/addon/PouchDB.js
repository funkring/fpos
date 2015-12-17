/*global Ext:false,PouchDB:false,DBUtil:false*/

Ext.define('Ext.data.reader.PouchDB',{
    extend: 'Ext.data.reader.Reader',
    alternateClassName: 'Ext.data.PouchDBReader',
    alias : 'reader.pouchdb'
    
    /*
    read: function(response) {
        var res = this.callParent(arguments);
        return res;
    }*/
    
});

/*
Ext.define('Ext.data.identifier.LocalUuid', {
    extend: 'Ext.data.identifier.Uuid',
    alias: 'identifier.localuuid',
    
    generate: function() {
        debugger;
        var self = this;
        var res = '_local/' + self.callParent(arguments);
        return res;
    }
});*/

Ext.define('Ext.proxy.PouchDB', {
    extend: 'Ext.data.proxy.Proxy',
    alias: 'proxy.pouchdb',
    requires: [
        'Ext.proxy.PouchDBUtil'
    ],
    config: {
        
        /**
         * @cfg {Object} reader
         * @hide
         */
        reader: "pouchdb",
        
        /**
         * @cfg {Object} writer
         * @hide
         */
        writer: null,
               
        /**
         * @cfg {String} database
         * Database name to access tables from
         */        
        database: null, 
        
        /**
         * @cfg {List} domain 
         * Tuple list of filters
         */
        domain: null,
        
        /**
         * @cfg  {List} default Domain
         * Default Domain is built from resModel + domain, and is used
         * for new documents and search
         */
        defaultDomain: null,
        
        /**
         * @cfg {String} view
         * View name for synchronisation
         */
        view: null,
        
        /**
         * @cfg {String} model name
         */
        resModel: null,
        
        /**
         * @cfg
         * Date Format
         */
        defaultDateFormat: 'Y-m-d H:i:s'
        
    },
    
     /**
     * Creates the proxy, throws an error if local storage is not supported in the current browser.
     * @param {Object} config (optional) Config object.
     
    constructor: function(config) {
        var self = this;
        self.callParent(arguments);                
        
    },*/
    
    applyResModel: function(resModel) {
        var self = this;
        if ( resModel ) {
            var defaultDomain = [["fdoo__ir_model","=",resModel]];
            
            // add domain values
            var domain = self.getDomain();
            if ( domain ) {
                Ext.each(domain, function(val) {
                    defaultDomain.push(val);
                });
            } 
            
            self.setDefaultDomain(defaultDomain);            
        } else {
            self.setDefaultDomain(self.getDomain());
        }
        return resModel;
    },
    
    /**
     * @private
     * Sets Exception to operation
     */
    setException: function(operation, err) {
        if (err) {
            operation.exception=err;
            this.fireEvent('exception', this, operation);            
        }
    },
    
    /**
     * @private
     */
    setCompleted: function(operation) {
        operation.setCompleted();           
        if (!operation.exception) {
            operation.setSuccessful(); 
        }
    },
    
    /**
     * @private
     * Build Domain Query
     */
    buildDomainQuery: function(domain, values, nobuild, override) {
      if (!domain) {
          return null;
      }
      
      var i, value, field, stmt, op;
      var ifstmt='';
      var ifstmt_op='&&';      
      var defaults={};
            
      for (i=0; i<domain.length;i++) {
          var tupl = domain[i];
          stmt = null;
          if ( tupl.constructor === Array && tupl.length == 3) {
              field = tupl[0];
              op = tupl[1];
              value = tupl[2];
              
              if ( op === '=') {
                  if (value === null || typeof value === 'string' ) {
                    op = '===';
                  } else {
                    op = '==';
                  } 
                      
                  if (values) {
                    if ( override || !values.hasOwnProperty(field) || values[field] === undefined) {
                        values[field]=value;
                    }
                  }                       
              } else if ( op === 'like') {
                if ( value === null ) {
                    op = '===';
                } else if ( typeof value === 'string' ) {
                    var tokens = value.split(/[\s, ]+/);
                    var filter = [];
                    
                    for (var tokI=0; tokI < tokens.length; tokI++) {
                        filter.push("doc."+field+".toString().toLowerCase().indexOf('"+tokens[tokI].toLowerCase()+"') > -1");
                    }
                    
                    stmt = 'doc.' + field + ' && (' + filter.join(' || ') + ')';                    
                } else {
                    stmt = '';
                }
              }
              
              if ( stmt === null) {
                if ( value === undefined || value === null) {
                    value = "null";
                } else if ( typeof value === 'string') {
                    value = "'" + value + "'";
                } else {
                    value = value.toString();
                }
                            
                stmt = 'doc.' + field + ' ' + op + ' ' + value;
              } 
          } 
          
          if ( stmt !== null && stmt.length > 0) {
              if ( ifstmt.length > 0 ) {
                  ifstmt += ' ';
                  ifstmt += ifstmt_op;  
                  ifstmt += ' ';
              }
              ifstmt += '(';
              ifstmt += stmt;
              ifstmt += ')';
          }          
      }
      
      if ( ifstmt.length === 0 || nobuild) { 
          return null;
      }
      
      return Ext.functionFactory('doc', 'if ( ' + ifstmt + ' ) emit(doc);');       
    },
    
        
    /**
     * @private
     * add Domain as Default Values 
     */
    addDomainAsDefaultValues: function(domain, values) {
        this.buildDomainQuery(domain, values, true, false);
    },
     
    
    /**
     * @public
     * get defaults
     */
    getDefaults : function() { 
        var res = {};
        this.buildDomainQuery(this.getDomain(), res, true, false);
        return res;
    },
     
    /**
     * @private
     * join domain
     */
    joinDomain: function(result, domain) {
        if (domain) {
            if (!result) {
                result = domain;
            } else {
                result = result.concat(domain);
            }
        }
        return result;
    }, 
    
    writeDate: function(field, date) {
        if (Ext.isEmpty(date)) {
            return null;
        }

        var dateFormat = field.getDateFormat() || this.getDefaultDateFormat();
        switch (dateFormat) {
            case 'timestamp':
                return date.getTime() / 1000;
            case 'time':
                return date.getTime();
            default:
                return Ext.Date.format(date, dateFormat);
        }
    },

    readDate: function(field, date) {
        if (Ext.isEmpty(date)) {
            return null;
        }

        var dateFormat = field.getDateFormat() || this.getDefaultDateFormat();
        switch (dateFormat) {
            case 'timestamp':
                return new Date(date * 1000);
            case 'time':
                return new Date(date);
            default:
                return Ext.isDate(date) ? date : Ext.Date.parse(date, dateFormat);
        }
    },
              
    /**
     * @private
     * @param {Object} data
     * 
     * convert Data
     * @return Record
     */
    createRecord: function(doc) {
        var Model   = this.getModel();
        var fields  = Model.getFields().items;
        var length  = fields.length;
        var data    = {};
        
        var i, field, name, value;
            
        if (!doc) {
            return undefined;
        }

        for (i = 0; i < length; i++) {
            field = fields[i];
            name  = field.getName();
            value = doc[name];
            
            if (typeof field.getDecode() == 'function') {
                data[name] = field.getDecode()(value);
            }  else {
                if (field.getType().type == 'date' && Ext.isDate(value)) {
                    data[name] = this.writeDate(field, value);
                } else {
                    data[name] = value;
                }
            }
        }
        
        var model = new Model(data, doc._id, doc);
        return model;
    },
    
    /**
     * @private 
     * @param {Object} record
     * create Document
     * @return Documetn
     */
    createDocument: function(record, defaults) {
        var Model   = this.getModel();
        var fields  = Model.getFields().items;
        var length  = fields.length;
        var data    = record.data;
        var doc     = {};
        
        // set defaults
        if ( defaults ) {
            for (var key in defaults) {
                doc[key]=defaults[key];
            }
        }

        // set fields        
        var i, field, name, value;
        for (i = 0; i < length; i++) {
            field = fields[i];
            name  = field.getName();
            value = data[name];
            
            // check for undefined and persist
            if ( value === undefined  || field.getPersist() === false ) {
                continue;
            }
            
            if (typeof field.getDecode() == 'function') {
                doc[name] = field.getEncode()(value, record);
            }  else {
                if (field.getType().type == 'date' && Ext.isDate(value)) {
                    doc[name] = this.writeDate(field, value);
                } else {
                    doc[name] = value;
                }
            }
        }
        
        doc._id = record.getId();
        return doc;
    },
    
    // callback helper
    tryCallback: function(result, callback, scope, err) {
        if (typeof callback == 'function') {
            if ( err ) {
                callback.call(scope || this, result, err);
            } else {
                callback.call(scope || this, result);
            }
        }
    },
    
    // read document callback
    readDocument: function(uuid, callback) {
        var self = this;
        var db = DBUtil.getDB(self.getDatabase());
        db.get(uuid).then(function(doc) {
            var record = self.createRecord(doc);
            callback(null,record);
        }).catch( function (err) {
            callback(err);
        });
    },
             
    // read function
    read: function(operation, callback, scope) {
        var self = this;
        var db = DBUtil.getDB(self.getDatabase());
        var param;
        var params = {'include_docs':true};
        var filter_domain = self.getDefaultDomain();
        
        // get sorters from store
        var defaultSorters = null;
        var defaultFilters = null;
        if ( scope instanceof Ext.data.Store) {
            defaultSorters = scope.getSorters();
            defaultFilters = scope.getFilters();
        }
        
        // set sorters
        var sorters = operation.getSorters() || defaultSorters;
        var filters = operation.getFilters() || defaultFilters;
        
        // set associations
        var associations = self.getModel().getAssociations().items;
            
        // PREPARE PARAMS                    
        var operation_params = operation.getParams();
        if (operation_params) {
            for (param in operation_params) {
                if (operation_params.hasOwnProperty(param)) {
                    if (param === 'domain') {
                        filter_domain = self.joinDomain(filter_domain, operation_params.domain);
                    } else {
                        params[param] = operation_params[param];
                    }
                }
            }
        } 
        // START OPERATION
        operation.setStarted();
        
        // RESULT
        var resultCallback = function(err, response){  
            var records = [];
            var rows = [];
            var queryCount = 1;
       
            // COMPLETE FUNCTION
            var complete = function() {
                if ( --queryCount === 0) {
                    // create records
                    Ext.each(rows, function(row) {
                        records.push(self.createRecord(row.doc));
                    });
                                        
                    // handle filter and sorters
                    if (records.length > 0) {
                        
                        var hasFilters = filters && filters.length;
                        var hasSorters = sorters && sorters.length;
                        
                        if ( hasFilters || hasSorters ) {
                            var filtered = Ext.create('Ext.util.Collection', function(record) {
                                return record.getId();
                            });
                            
                            // add filters
                            if ( hasFilters ) {
                                filtered.setFilterRoot('data');
                                filtered.addFilters(filters);
                            }
                            
                            // add sorters
                            if ( hasSorters ) {
                                filtered.setSortRoot('data');
                                filtered.addSorters(sorters);                          
                            }
                            
                            //filter and sort
                            filtered.addAll(records);
                            records = filtered.items.slice();
                        }
                    }   
                    
                    // set completed and records
                    self.setCompleted(operation);        
                    operation.setRecords(records);
                    
                    //CALLBACK
                    self.tryCallback(operation, callback, scope, err);
                }
            };
            
            if (err) {
                self.setException(operation, err);
            } else {
                // GET ROWS
                rows = response.rows;
                
                // INSPECT ASSOCIATIONS
                if ( associations && associations.length > 0 ) {
                
                    Ext.each(rows, function(row) {
                        
                        Ext.each(associations, function(assoc) {     
                            var foreign_key = assoc.getForeignKey();
                            var assoc_key = assoc.getAssociationKey();
                                                    
                            if ( foreign_key && assoc_key ) {
                                var foreign_uuid = row.doc[foreign_key];
                                if ( foreign_uuid ) {
                                    
                                    //NEW QUERY                                
                                    queryCount++;
                                    
                                    db.get(foreign_uuid, function(err, doc) {
                                        if (err===null) {
                                            row.doc[assoc_key] = doc;
                                        }    
                                        
                                        //COMPLETE                                 
                                        complete();                                    
                                    });    
                                }  
                            }                         
                            
                        });                        
                    });
                    
                }
                                               
            }    
            
            // COMPLETE            
            complete();          
        };                
        
        // QUERY
        DBUtil.search(db, filter_domain, params, resultCallback);
    },
    
    // update function
    update: function(operation, callback, scope) {
        var self = this;    
        var db = DBUtil.getDB(self.getDatabase());
         
        operation.setStarted();
        
        var records = operation.getRecords();                   
        var operationCount = records.length+1;
        
        Ext.each(operation.getRecords(), function(record) {
           //get current values          
           db.get(record.getId(), function(err, doc) {
                // get defaults
                var defaults;
                if (!err) {
                    defaults = doc;
                } else {
                    defaults = {};
                    self.addDomainAsDefaultValues(self.getDefaultDomain(), defaults);
                }
                
                //create next doc
                var nextDoc = self.createDocument(record, defaults);
                db.put(nextDoc, function(err,response) {
                     self.setException(operation, err);
                     
                     if ( !err ) {
                         record.phantom = false;
                     }                 
                     
                     //check if finished
                     if ( --operationCount <= 0 ) {
                         self.setCompleted(operation);
                         self.tryCallback(operation, callback, scope);
                     }
                });
           });
         
        });
        
        if ( --operationCount <= 0 ) {
             self.setCompleted(operation);
             self.tryCallback(operation, callback, scope);
        }
    },
    
    // create function is the same as update
    create: function(operation, callback, scope) {
        return this.update(operation, callback, scope);
    },
    
    // destroy
    destroy: function(operation, callback, scope) {
        var self = this;     
        var db = DBUtil.getDB(self.getDatabase());
           
        operation.setStarted();
        
        var records = operation.getRecords();                   
        var operationCount = records.length+1;
        
        Ext.each(operation.getRecords(), function(record) {           
           db.remove(record.raw, function(err,response) {
                self.setException(operation, err);
                
                //check if finished
                operationCount--;
                if ( operationCount <= 0) {
                    self.setCompleted(operation);
                    self.tryCallback(operation, callback, scope);
                }    
           });
        }); 
        
        if ( operationCount <= 0 ) {
            self.setCompleted(operation);
            self.tryCallback(operation, callback, scope);
        }
    }
    
});