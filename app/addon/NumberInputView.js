/*global Ext:false, futil:false, ViewManager: false*/
Ext.define('Ext.view.NumberInputView', {
    extend: 'Ext.Panel',
    xtype: 'numberinput',
    requires: [
        'Ext.Button',
        'Ext.Container',
        'Ext.view.NumDisplay',
        'Ext.field.PatternText',
        'Ext.form.ViewManager'
    ],
    config: {    
        layout: 'vbox', 
        
        firstReplace: true,
        
        autoRemoveHandler: false, 
            
        handler: null,
        
        editHandler: null,
        
        hideOnMaskTap: true,
                
        hideOnInputDone: true,
        
        showButtons: true,
                
        modal: true,
        
        emptyValue: 0.0,
        
        maxlen: 0,
        
        minlen: 0,
        
        ui: 'calc',
        
        title: null,
        
        width: '336px',
        
        listeners: [
            {
                fn: 'addNumber',
                event: 'release',
                delegate: 'button[action=addNumber]'
            },
            {
                fn: 'clearInput',
                event: 'release',
                delegate: 'button[action=clearInput]'
            },
            {
                fn: 'changeSign',
                event: 'release',
                delegate: 'button[action=changeSign]'                
            },
            {
                fn: 'addComma',
                event: 'release',
                delegate: 'button[action=addComma]'
            },
            {
                fn: 'numInputDone',
                event: 'release',
                delegate: 'button[action=numInputDone]'   
            },
            {
                fn: 'showInput',
                event: 'show'
            },
            {
                fn: 'showInput',
                event: 'painted'
            },
            {
                fn: 'hideInput',
                event: 'hide'
            },
            {
                fn: 'editDetail',
                event: 'release',
                delegate: 'numberview'
            }
                
        ]
    },
    
    initialize: function() {
         var self = this;
         self.callParent(arguments);
         
         self.numField = Ext.create("Ext.view.NumDisplay"); 
         self.add(self.numField);
         
         self.setValue(self.getEmptyValue());
         var title = self.getTitle();
         if ( title ) {
             self.numField.setInfo(title);
         }
         
         if ( self.getShowButtons() ) {
         
             var bWidth = '72px';
             var bHeight = '66px';
             var bSpecialWidth = '80px';
             var bDoubleWidth = '148px';
             var bDoubleHeight = '136px';
             var bTripleWidth = '224px';
             var bTripleHeight = '206px';
                      
             if ( self.getUi() === 'pin') {
             
                /*****************************************************************
                * PIN LAYOUT
                *****************************************************************/
             
                self.add({
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
                                        width:  bWidth,
                                        height: bHeight,
                                        ui: 'numInputButtonBlack',
                                        cls: 'NumInputButton',
                                        action: 'addNumber'
                                        
                                    },
                                    {
                                        xtype: 'button',
                                        text: '8',
                                        width:  bWidth,
                                        height: bHeight,
                                        ui: 'numInputButtonBlack',
                                        cls: 'NumInputButton',
                                        action: 'addNumber'                        
                                    },
                                    {
                                        xtype: 'button',
                                        text: '9',
                                        width:  bWidth,
                                        height: bHeight,          
                                        ui: 'numInputButtonBlack',                      
                                        cls: 'NumInputButton',
                                        action: 'addNumber'
                                    }, 
                                    {
                                        xtype: 'button',
                                        iconCls: 'delete',
                                        width: bSpecialWidth,
                                        height: bHeight,          
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
                                        layout: 'vbox',
                                        items: [
                                            {
                                                layout: 'hbox',
                                                items: [
                                                    {                                
                                                        xtype: 'button',
                                                        text: '4',
                                                        width:  bWidth,
                                                        height: bHeight,
                                                        ui: 'numInputButtonBlack',
                                                        cls: 'NumInputButton',
                                                        action: 'addNumber'
                                                    },
                                                    {
                                                        xtype: 'button',
                                                        text: '5',
                                                        width:  bWidth,
                                                        height: bHeight,
                                                        ui: 'numInputButtonBlack',
                                                        cls: 'NumInputButton',
                                                        action: 'addNumber'
                                                    },
                                                    {
                                                        xtype: 'button',
                                                        text: '6',
                                                        width:  bWidth,
                                                        height: bHeight,          
                                                        ui: 'numInputButtonBlack',                      
                                                        cls: 'NumInputButton',
                                                        action: 'addNumber'
                                                    }
                                                 ]
                                            },
                                            {
                                                layout: 'hbox',
                                                items: [
                                                    {                                
                                                        xtype: 'button',
                                                        text: '1',
                                                        width:  bWidth,
                                                        height: bHeight,
                                                        ui: 'numInputButtonBlack',
                                                        cls: 'NumInputButton',
                                                        action: 'addNumber'
                                                    },
                                                    {
                                                        xtype: 'button',
                                                        text: '2',
                                                        width:  bWidth,
                                                        height: bHeight,
                                                        ui: 'numInputButtonBlack',
                                                        cls: 'NumInputButton',
                                                        action: 'addNumber'
                                                    },
                                                    {
                                                        xtype: 'button',
                                                        text: '3',
                                                        width:  bWidth,
                                                        height: bHeight,          
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
                                                        width:  bTripleWidth,
                                                        height: bHeight,
                                                        ui: 'numInputButtonBlack',
                                                        cls: 'NumInputButton',
                                                        action: 'addNumber'
                                                    }
                                                ]
                                            }
                                        
                                        ]
                                    },
                                    {
                                        xtype: 'button',
                                        iconCls: 'action',   
                                        width: bSpecialWidth,
                                        height: bTripleHeight,
                                        ui: 'numInputButtonGreen',
                                        cls: 'NumInputButton',
                                        action: 'numInputDone'
                                    }
                                ]         
                            }
                        ]
                        
                });
                    
             } else  {         
             
                 /*****************************************************************
                  * DEFAULT LAYOUT
                  *****************************************************************/
             
                 self.add({
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
                                        width:  bWidth,
                                        height: bHeight,
                                        ui: 'numInputButtonBlack',
                                        cls: 'NumInputButton',
                                        action: 'addNumber'
                                        
                                    },
                                    {
                                        xtype: 'button',
                                        text: '8',
                                        width:  bWidth,
                                        height: bHeight,
                                        ui: 'numInputButtonBlack',
                                        cls: 'NumInputButton',
                                        action: 'addNumber'                                
                                    },
                                    {
                                        xtype: 'button',
                                        text: '9',
                                        width:  bWidth,
                                        height: bHeight,          
                                        ui: 'numInputButtonBlack',                      
                                        cls: 'NumInputButton',
                                        action: 'addNumber'
                                    }, 
                                    {
                                        xtype: 'button',
                                        text: 'CE',
                                        width:  bSpecialWidth,
                                        height: bHeight,          
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
                                        width:  bWidth,
                                        height: bHeight,
                                        ui: 'numInputButtonBlack',
                                        cls: 'NumInputButton',
                                        action: 'addNumber'
                                    },
                                    {
                                        xtype: 'button',
                                        text: '5',
                                        width:  bWidth,
                                        height: bHeight,
                                        ui: 'numInputButtonBlack',
                                        cls: 'NumInputButton',
                                        action: 'addNumber'
                                    },
                                    {
                                        xtype: 'button',
                                        text: '6',
                                        width:  bWidth,
                                        height: bHeight,          
                                        ui: 'numInputButtonBlack',                      
                                        cls: 'NumInputButton',
                                        action: 'addNumber'
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
                                                        width:  bWidth,
                                                        height: bHeight,
                                                        ui: 'numInputButtonBlack',
                                                        cls: 'NumInputButton',
                                                        action: 'addNumber'
                                                    },
                                                    {
                                                        xtype: 'button',
                                                        text: '2',
                                                        width:  bWidth,
                                                        height: bHeight,
                                                        ui: 'numInputButtonBlack',
                                                        cls: 'NumInputButton',
                                                        action: 'addNumber'
                                                    },
                                                    {
                                                        xtype: 'button',
                                                        text: '3',
                                                        width:  bWidth,
                                                        height: bHeight,          
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
                                                        width:  bDoubleWidth,
                                                        height: bHeight,
                                                        ui: 'numInputButtonBlack',
                                                        cls: 'NumInputButton',
                                                        action: 'addNumber'
                                                    },
                                                    {
                                                        xtype: 'button',
                                                        text: '.',
                                                        width:  bWidth,
                                                        height: bHeight,
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
                                        text: 'OK',
                                        width: bWidth,
                                        height: bDoubleHeight,
                                        ui: 'numInputButtonBlack',
                                        cls: 'NumInputButton',
                                        action: 'numInputDone'
                                    }
                                
                                ]
                            }          
                        ]
                        
                    });
                }
            }
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
        this.addChar(button.getText());        
    },
    
    addChar: function(c) {
        var val = this.numField.getValue();
        if ( !val || this.getFirstReplace() ) {
            val = '';             
            this.setFirstReplace(false);            
        }
        val+=c;
        var maxlen = this.getMaxlen();
        if ( !maxlen || val.length <= maxlen ) {    
            this.numField.setValue(val);
        }
    },
    
    setValue: function(val) {
        if ( typeof val === 'number' || typeof val === 'numericalValue') {
            this.numField.setValue(futil.formatFloat(val,0));
        } else {
            this.numField.setValue(val);
        }
        return val;
    },
    
    getValue: function(val) {
        if ( this.getUi() === "pin") {
            return this.numField.getValue();
        } else {
            return futil.parseFloat(this.numField.getValue());
        }
    },
    
    clearInput: function() {
        var defaultValue = this.getEmptyValue();
        this.numField.setError(null);
        this.setValue(defaultValue);        
        this.setFirstReplace(true);
    },
    
    setError: function(err) {
        this.numField.setError(err);
    },    
    
    changeSign: function() {
        var val = this.getValue();
        val=val*-1.0;
        this.setValue(val);
    },
    
    numInputDone: function() {
        var value = this.getValue();
        var minlen = this.getMinlen();
        if ( minlen > 0 && (!value || value.length < minlen || value === this.getEmptyValue() ) ) {
            this.numField.setError("Eingabe zu kurz! </br> Mindestens " + minlen + " Stellen");
        } else {
            try {        
                var handler = this.getHandler();
                if ( handler ) {
                    handler(this, this.getValue());
                }
            } finally {
                if ( this.getHideOnInputDone() ) {
                    this.hide();
                }
            }
        }
    },
    
    showInput: function()  {
        if ( !this.visible ) {
            this.visible=true;
            this.setFirstReplace(true);    
            ViewManager.pushKeyboardListener(this); 
        }
    },    
    
    hideInput: function() {
        if ( this.visible ) {
            ViewManager.popKeyboardListener(this);
            this.visible=false;            
            this.removeHandler();
            this.clearInput();
        }
    },
    
    removeHandler: function() {
        if ( this.getAutoRemoveHandler() ) {
            this.setHandler(null); 
            this.setEditHandler(null);
        }
    },
    
    showBy: function(component, alignment, animation, value, handler, editHandler) {
        var self = this;
        
        if ( !value ) {
            value = self.getEmptyValue();
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
                self.removeHandler();
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
    },
    
    onKeyCode: function(keycode) {       
        if ( keycode >= 48 && keycode <= 57 ) {
            var c = String.fromCharCode(keycode);
            this.addChar(c);
        } else if ( keycode == 13 ) {
            this.numInputDone();
        } else if ( keycode == 27 ) {
            this.clearInput();
        }
    },
    
    onKeyDown: function(e) {
        var keycode = e.keyCode ? e.keyCode : e.which;
        this.onKeyCode(keycode);
    }
});

