/*global Ext:false*/

Ext.define('Ext.util.BarcodeScanner', {
    requires: ['Ext.util.DelayedTask'],
    
    config: {
        keyListener: null,
        barcodeListener: null,
        delay: 80
    },
    
    constructor: function(cfg) {
        var self = this;
        self.initConfig(cfg);
        
        self.keyCodes = [];
        
        self.forwardKeyTask = Ext.create('Ext.util.DelayedTask', function() {
            self.cancelBarcode();
        });
        
        self.delay = self.getDelay();      
        return self;
    },
    
    detectBarcode: function(e) {
        var keycode = e.keyCode;
        if ( keycode ) {
            // check keys
            if ( keycode >= 48 && keycode <= 70  ) {
                // add number    
                this.keyCodes.push(keycode);
                this.forwardKeyTask.delay(this.delay);
            } else if ( keycode == 13 && this.keyCodes.length > 0) {
                // finish barcode
                this.finishBarcode();
            } else {
                // cancel barcode
                this.cancelBarcode(keycode);
            }           
        } else {
            keycode = e.wich;
            if ( keycode ) {
                this.cancelBarcode(keycode);
            }
        }     
    },
    
    cancelBarcode: function(keycode) {
        this.forwardKeyTask.cancel();
        var self = this;
                
        try {
            // forward keys if listener defined
            var keyListener = self.getKeyListener();
            if ( keyListener ) {
                for ( var i=0; i < self.keyCodes.length; i++ ) {
                    keyListener(self.keyCodes[i]);
                }                
                if ( keycode !== undefined ) {
                    keyListener(keycode);
                }
            }
        } finally {                
            self.keyCodes = [];
        }
        
    },
    
    finishBarcode: function() {
        this.forwardKeyTask.cancel();
        var self = this;
        try {
            var barcodeListener = self.getBarcodeListener();            
            if ( barcodeListener ) {
                var chars = [];
                for ( var i=0; i< self.keyCodes.length; i++ ) {
                    chars.push(String.fromCharCode(self.keyCodes[i]));
                }
                barcodeListener(chars.join(''));
            }            
        } finally {
            self.keyCodes = [];
        }        
    }
    
});