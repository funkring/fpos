/*global Ext:false, futil:false, DBUtil:false*/

Ext.define('Ext.form.ViewManager', {
    alternateClassName: 'ViewManager',
    singleton: true,
    requires: [
      'Ext.ux.Deferred',
      'Ext.Panel'
    ],
    config : {
        
    },
    
    constructor: function(config) {
        this.initConfig(config);
    },
    
    updateButtonState: function(view, saveButton, deleteButton) {
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
        
        if ( saveButton ) {
             if (saveable) {
               saveButton.show();
            } else {
               saveButton.hide();
            }
        }
       
        if ( deleteButton ) {
             if (deleteable) {
               deleteButton.show();
            } else {
               deleteButton.hide();
            }
        }
        
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
        futil.startLoading("Daten validieren...");             
          
        //invoke asynchronly
        var deferred = Ext.create('Ext.ux.Deferred');
            setTimeout(function() {
                var view = mainView.getActiveItem();
                
                futil.stopLoading();                
                var valid = self.validateView(view);                 
                if ( valid ) {
                    futil.startLoading("Änderungen werden gespeichert...");
                    
                    // record var
                    var record = null;
                    
                    // get handlers
                    var saveHandler = view.saveHandler || view.config.saveHandler;
                    var savedHandler = view.savedHandler || view.config.savedHandler;
                                            
                    // the reload handler
                    var reloadHandler = function(err) {
                        futil.stopLoading();
                         
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
                            // remove view
                            mainView.pop(popCount); 
                            
                            // call other handler
                            if (savedHandler) {
                                savedHandler();
                            }
                            
                            // resolve
                            deferred.resolve();                            
                        }       
                    };
                    
                    if ( saveHandler ) {
                        var res = saveHandler(view);
                        if ( res ) {
                            res.then(reloadHandler).catch(reloadHandler);
                        } else {
                            reloadHandler();
                        }         
                    } else {
                        // otherwise try to store record
                        record = view.getRecord();
                        if ( record !== null ) {
                            var values = view.getValues(); 
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
                    deferred.reject("invalidField");
                }
        },0);
        
        return deferred.promise();
    },
    
    
    createNumberInput: function() {
        var inputView = Ext.define('Ext.Panel', {
            layout: 'vbox', 
            
            firstReplace: true,
                
            handler: null,
            
            editHandler: null,
            
            hideOnMaskTap : true,
                    
            modal: true,
            
            width: '336px',
            
            listeners: [
                {
                    fn: 'addNumber',
                    event: 'tap',
                    delegate: 'button[action=addNumber]'
                },
                {
                    fn: 'clearInput',
                    event: 'tap',
                    delegate: 'button[action=clearInput]'
                },
                {
                    fn: 'changeSign',
                    event: 'tap',
                    delegate: 'button[action=changeSign]'                
                },
                {
                    fn: 'addComma',
                    event: 'tap',
                    delegate: 'button[action=addComma]'
                },
                {
                    fn: 'numInputDone',
                    event: 'tap',
                    delegate: 'button[action=numInputDone]'   
                },
                {
                    fn: 'showInput',
                    event: 'show'
                },
                {
                    fn: 'hideInput',
                    event: 'hide'
                },
                {
                    fn: 'editDetail',
                    event: 'tap',
                    delegate: 'numberview'
                }
                    
            ], 
            items: [
                {   
                    xtype: 'container',
                    layout: 'hbox',
                    items: [
                        {
                            xtype: 'numberview',
                            flex: 1
                        }                
                    ]      
                    
                },
                {
                    xtype: 'container',
                    layout: 'vbox',
                    cls: 'NumInputContainer',
                    items: [
                        {
                            layout: 'hbox',
                            items: [
                                {                                
                                    xtype: 'button',
                                    text: '7',
                                    width: '72px',
                                    height: '66px',
                                    ui: 'numInputButtonBlack',
                                    cls: 'NumInputButton',
                                    action: 'addNumber'
                                    
                                },
                                {
                                    xtype: 'button',
                                    text: '8',
                                    width: '72px',
                                    height: '66px',
                                    ui: 'numInputButtonBlack',
                                    cls: 'NumInputButton',
                                    action: 'addNumber'                                
                                },
                                {
                                    xtype: 'button',
                                    text: '9',
                                    width: '72px',
                                    height: '66px',          
                                    ui: 'numInputButtonBlack',                      
                                    cls: 'NumInputButton',
                                    action: 'addNumber'
                                }, 
                                {
                                    xtype: 'button',
                                    text: 'CE',
                                    width: '80px',
                                    height: '66px',          
                                    ui: 'numInputButtonRed',                      
                                    cls: 'NumInputButton',
                                    action: 'clearInput'
                                }
                            ]                    
                        },
                        {
                            layout: 'hbox',
                            items: [
                                {                                
                                    xtype: 'button',
                                    text: '4',
                                    width: '72px',
                                    height: '66px',
                                    ui: 'numInputButtonBlack',
                                    cls: 'NumInputButton',
                                    action: 'addNumber'
                                },
                                {
                                    xtype: 'button',
                                    text: '5',
                                    width: '72px',
                                    height: '66px',
                                    ui: 'numInputButtonBlack',
                                    cls: 'NumInputButton',
                                    action: 'addNumber'
                                },
                                {
                                    xtype: 'button',
                                    text: '6',
                                    width: '72px',
                                    height: '66px',          
                                    ui: 'numInputButtonBlack',                      
                                    cls: 'NumInputButton',
                                    action: 'addNumber'
                                }, 
                                {
                                    xtype: 'button',
                                    text: '+/-',
                                    width: '72px',
                                    height: '66px',          
                                    ui: 'numInputButtonBlack',                      
                                    cls: 'NumInputButton',
                                    action: 'changeSign'
                                }
                            ]                    
                        },
                        {
                            layout: 'hbox',
                            items: [
                                {
                                    layout: 'vbox',
                                    items: [
                                        {
                                            layout: 'hbox',
                                            items: [
                                                {                                
                                                    xtype: 'button',
                                                    text: '1',
                                                    width: '72px',
                                                    height: '66px',
                                                    ui: 'numInputButtonBlack',
                                                    cls: 'NumInputButton',
                                                    action: 'addNumber'
                                                },
                                                {
                                                    xtype: 'button',
                                                    text: '2',
                                                    width: '72px',
                                                    height: '66px',
                                                    ui: 'numInputButtonBlack',
                                                    cls: 'NumInputButton',
                                                    action: 'addNumber'
                                                },
                                                {
                                                    xtype: 'button',
                                                    text: '3',
                                                    width: '72px',
                                                    height: '66px',          
                                                    ui: 'numInputButtonBlack',                      
                                                    cls: 'NumInputButton',
                                                    action: 'addNumber'
                                                } 
                                            ]                                
                                        },
                                        {
                                            layout: 'hbox',
                                            items:  [
                                                {                                
                                                    xtype: 'button',
                                                    text: '0',
                                                    width: '148px',
                                                    height: '66px',
                                                    ui: 'numInputButtonBlack',
                                                    cls: 'NumInputButton',
                                                    action: 'addNumber'
                                                },
                                                {
                                                    xtype: 'button',
                                                    text: '.',
                                                    width: '72px',
                                                    height: '66px',
                                                    ui: 'numInputButtonBlack',
                                                    cls: 'NumInputButton',
                                                    action: 'addComma'
                                                }
                                            ]
                                        }
                                    ]                                                            
                                },
                                {
                                    xtype: 'button',
                                    text: '=',
                                    width: '72px',
                                    height: '136px',
                                    ui: 'numInputButtonBlack',
                                    cls: 'NumInputButton',
                                    action: 'numInputDone'
                                }
                            
                            ]
                        }          
                    ]
                    
                }
            
            
            ],
            
            
            initialize: function() {
                 var self = this;
                 self.callParent(arguments);
                 self.numField = self.query('numberview')[0];     
            },
            
            addComma: function() {
                var val = this.numField.getValue();
                if ( val && val.indexOf(futil.comma) !== -1 ) {
                    return;
                }
                val+=futil.comma;
                this.numField.setValue(val);
            },
            
            addNumber: function(button) {
                var val = this.numField.getValue();
                if ( !val || this.getFirstReplace() || val=='0' ) {
                    this.setFirstReplace(false);
                    val = '';
                }
                val+=button.getText();   
                this.numField.setValue(val);
            },
            
            setValue: function(val) {
                this.numField.setValue(futil.formatFloat(val,0));
                return val;
            },
            
            getValue: function(val) {
                return futil.parseFloat(this.numField.getValue());
            },
            
            clearInput: function() {
                this.setValue(0.0);
            },
            
            changeSign: function() {
                var val = this.getValue();
                val=val*-1.0;
                this.setValue(val);
            },
            
            numInputDone: function() {
                try {        
                    var handler = this.getHandler();
                    if ( handler ) {
                        handler(this, this.getValue());
                    }
                } finally {
                    this.hide();
                }
            },
            
            showInput: function()  {
                this.visible=true;
                this.setFirstReplace(true);     
            },    
            
            hideInput: function() {
                if ( this.visible ) {
                    this.visible=false;
                    this.setHandler(null);
                }
            },
            
            showBy: function(component, alignment, animation, value, handler, editHandler) {
                var self = this;
                
                if ( !value ) {
                    value = 0.0;
                }
                
                self.setValue(value);        
                self.setHandler(handler);
                self.setEditHandler(editHandler);
            
                // call parent        
                var successful = false;
                try {
                    self.callParent(arguments);
                    successful = true;
                } finally {
                    if (!successful) {
                        self.setHandler(null); 
                    }
                }
            },
                
            editDetail: function() {
                try {        
                    var handler = this.getEditHandler();
                    if ( handler ) {
                        handler(this, this.getValue());
                    }
                } finally {
                    this.hide();
                }
            }
        });
    
        
    }
    
        
    
});