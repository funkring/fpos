/*global Ext:false, futil:false, DBUtil:false*/


/**
 * Workarounds 
 */
 
// Fix Freeze after double OK Button Click (https://www.sencha.com/forum/showthread.php?284450)
Ext.override(Ext.MessageBox, {    
    hide:  function() {
        if (this.activeAnimation && this.activeAnimation._onEnd) {
            this.activeAnimation._onEnd();
        }
        return this.callParent(arguments);
    }
});


/**
 * View manager
 */
Ext.define('Ext.form.ViewManager', {
    alternateClassName: 'ViewManager',
    singleton: true,
    requires: [
      'Ext.ux.Deferred',
      'Ext.Panel',
      'Ext.MessageBox'
    ],
    config : {
        
    },
    
    constructor: function(config) {
        this.initConfig(config);
    },
    
    updateButtonState: function(view, items) {
        var saveable = false;
        var deleteable = false;
        
        if ( view.saveable || view.config.saveable ) {
            saveable = true;
            if (view.deleteable || view.config.deleteable ) {
                var record = view.getRecord();
                if ( record && !record.phantom ) {
                    deleteable = true;
                }
            } 
        } 
        
        if ( items.saveButton ) {
             if (saveable) {
               items.saveButton.show();
            } else {
               items.saveButton.hide();
            }
        }
       
        if ( items.deleteButton ) {
             if (deleteable) {
               items.deleteButton.show();
            } else {
               items.deleteButton.hide();
            }
        }
        
        var menu = view.menu || view.config.menu;
        var menuSide = items.menuSide || 'left';
        if ( menu ) {
             Ext.Viewport.setMenu(menu, {
                 side: menuSide,
                 reveal: true
             });
             if ( items.menuButton ) {
                 items.menuButton.show();
             }             
        } else if ( items.menuButton )  {
            items.menuButton.hide();
            Ext.Viewport.removeMenu(menuSide);
        }        
    },
    
    /**
     * start loading
     */
    startLoading : function(msg) {
        Ext.Viewport.setMasked({xtype: 'loadmask', message: msg});    
    },
    
    /**
     * stop loading
     */
    stopLoading : function() {
        Ext.Viewport.setMasked(false);
    },
    
    /**
     * @return true if valid
     */
    validateView: function(view) {
        var isValid = true;
        var fields = view.query("field");
        
        for (var i=0; i<fields.length; i++) {
            var fieldValid = true;
            var field = fields[i];
            var value = field.getValue();
           
            // trim value
            if ( value && typeof value == "string") {
                value = field.getValue().trim();
            }
            
            // check required
            var empty = (value === null || value === "" );
            if ( field.getRequired() &&  empty )  {
                 fields[i].addCls('invalidField');
                 fieldValid = false;
            } else {
                // check number field
                if ( field.config.xtype == "numberfield" ) {     
                    var intValue = 0;            
                    
                    // check minimum
                    if ( field.config.maxValue ) {
                        intValue = parseInt(value,10);
                        if (intValue > field.config.maxValue) {
                            fields[i].addCls('invalidField');
                            fieldValid = false;
                        }
                    }
                    
                    // check maximum
                    if ( field.config.minValue ) {
                        intValue = parseInt(value,10);
                        if (intValue < field.config.minValue) {
                            fields[i].addCls('invalidField');
                            fieldValid = false;
                        }
                    }                    
                  
                }
                
                // check pattern
                if ( !empty && field.config.pattern ) {    
                    var pattern = new RegExp(field.config.pattern);
                    if ( !pattern.test(value) ) {
                        fields[i].addCls('invalidField');
                        fieldValid = false;
                    }
                }
            }
            
            if ( fieldValid ) {
                fields[i].removeCls('invalidField');                
            } else {
                isValid = false;
                fields[i].addCls('invalidField');
            }
            
            
        }
        
        return isValid;
    },
    
    /**
     * save record
     */
    saveRecord: function(mainView) {
        var self = this;
        self.startLoading("Daten validieren...");             

        var deferred = Ext.create('Ext.ux.Deferred');
        
        //invoke asynchronly
        setTimeout(function() {            
            var view = mainView.getActiveItem();
            var valid = self.validateView(view);                 
            if ( valid ) {
                self.startLoading("Änderungen werden gespeichert...");
                
                // record var
                var record = null;
                
                // get handlers
                var saveHandler = view.saveHandler || view.config.saveHandler;
                var savedHandler = view.savedHandler || view.config.savedHandler;
                                        
                // the reload handler
                var reloadHandler = function(err) {
                    
                    if ( err ) {
                        deferred.reject(err);
                    } else {               
                        //check selection pattern
                        var prevView = mainView.getPreviousItem();
                        var popCount = 1;
                        if (prevView && record) {
                            // check field select record function
                            var fieldSelectRecord = prevView.fieldSelectRecord || prevView.config.fieldSelectRecord;
                            if (fieldSelectRecord) {
                                fieldSelectRecord(record);
                                popCount++;
                            } 
                        }
                        // remove view(s)
                        mainView.pop(popCount);
                        
                        // call after save handler
                        if (savedHandler) {
                            var promiseSaveHandler = savedHandler();
                            if ( promiseSaveHandler ) {
                                promiseSaveHandler
                                    .then(function() {
                                        deferred.resolve();
                                    })
                                    ['catch'](function(err) {
                                        deferred.reject(err);
                                    });
                                
                            } else {
                                deferred.resolve();
                            }                         
                        } else {                        
                            // resolve
                            deferred.resolve();
                        }                            
                    }       
                };
                
                if ( saveHandler ) {
                    var res = saveHandler(view);
                    if ( res ) {
                        res.then(function() {
                            reloadHandler();
                        })['catch'](reloadHandler);
                    } else {
                        reloadHandler();
                    }         
                } else {
                    // otherwise try to store record
                    record = view.getRecord();
                    if ( record !== null ) {
                        var values = view.getValues();
                        // convert records to id
                        record.set(values);
                        record.save({
                           callback: function() {
                              reloadHandler();
                           }
                        });
                    } else {
                        reloadHandler();
                    }
                }
            } else {      
                deferred.reject();
            }
        },0);
      
        // return promise
        var promise = deferred.promise(); 
        return promise
            ['catch'](function(err) {
                self.stopLoading();
            })
            .then(function(result) {
                self.stopLoading();                
            });
    },
    
    handleError: function(err, alternativeError, forward) {
        if ( !err.name || !err.message) {
            if ( err.data && err.data.name && err.data.message ) {
                err = err.data;
            } else {
                err = alternativeError;
            }
        }
        Ext.Msg.alert(err.name, err.message);
        if (forward) throw err;
    }
    
});