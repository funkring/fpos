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
        this.keyboardListenerStack=[];
    },
    
    updateButtonState: function(view, items) {
        var saveable = false;
        var deleteable = false;
        
        if ( this.hasViewOption(view, 'saveable') ) {
            saveable = true;
            if ( this.hasViewOption(view, 'deleteable') ) {
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
        
        var menu = this.getViewOption(view, 'menu');
        var menuSide = items.menuSide || 'right';
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
    
    hideMenus: function() {
        var menus = Ext.Viewport.getMenus();
        if ( menus.right && !menus.right.isHidden() ) {
            Ext.Viewport.hideMenu("right");
        }
        if ( menus.left && !menus.left.isHidden() ) {
            Ext.Viewport.hideMenu("left");
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
     * is loading
     */
    isLoading: function() {
        var mask = Ext.Viewport.getMasked();
        if ( !mask ) return false;
        if ( mask.isHidden() ) return false;
        return true;
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
                        if ( record.getProxy() ) {                            
                            record.save({
                               callback: function() {
                                  reloadHandler();
                               }
                            });
                        } else {
                            reloadHandler();
                        }
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
        if ( !err || !err.name || !err.message) {
            if ( err && err.data && err.data.name && err.data.message ) {
                err = err.data;
            } else {
                err = alternativeError;
            }
        } else if ( typeof err === 'string' ) {
            err = {
                name : alternativeError.name,
                message : err
            };
        }
        Ext.Msg.alert(err.name, err.message);
        if (forward) throw err;
    },
    
    pushKeyboardListener: function(listener) {
        var self = this;
        if ( !(listener in self.keyboardListenerStack)) {
            if ( self.keyboardListenerStack.length === 0) {
                if ( !self.keyInputListener ) {
                    self.keyInputLister = Ext.bind(self.onKeyDown, self);
                }
                document.addEventListener("keydown", self.keyInputLister, false);
            }
            self.keyboardListenerStack.push(listener);
        }
    },
    
    popKeyboardListener: function(listener) {
        var self = this;
        while ( self.keyboardListenerStack.length > 0 && self.keyboardListenerStack.pop() != listener);

        if ( self.keyboardListenerStack.length === 0 ) {
            document.removeEventListener("keydown", self.keyInputLister);
        }
    },
    
    onKeyDown: function(e) {
        var len = this.keyboardListenerStack.length;
        if ( len > 0 ) {
             this.keyboardListenerStack[len-1].onKeyDown(e);
        }
    },
    
    hasViewOption: function(view, opt) {
        var res = view[opt];
        if ( res === undefined ) {
            res = view.config[opt];           
        }
        return res ? true : false;
    },
    
    setViewOption: function(view, opt, val) {
        view[opt] = val;
    },
    
    getViewOption: function(view, opt) {
        var res = view[opt];
        if ( res === undefined ) {
            res = view.config[opt];           
        }
        return res;
    }
    
});