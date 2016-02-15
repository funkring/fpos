/*global Ext:false, DBUtil:false, PouchDB:false, openerplib:false, futil:false, Fpos:false, Config:false, ViewManager:false */
Ext.define('Fpos.controller.ScaleViewCtrl', {
    extend: 'Ext.app.Controller',
    requires: [    
        "Ext.Button",
        "Ext.Label"
    ],
    config: {
        refs: {
            scaleView: '#scaleView',
            scaleLabel: '#scaleLabel'
        },
        control: {
            'button[action=stopScale]': {
                tap: 'onStopScale'
            }, 
            scaleView: {
                startScale: 'startScale',
                hide: 'onHide'
            },
            scaleLabel: {
                initialize: 'scaleLabelInitialize'
            }             
        }
    },
    
    init: function() {
        this.reinit = false;
        this.price = 0.0;
        this.tara = 0.0;        
        this.timeout = 500;
        this.state = 0;
    },
    
    scaleLabelInitialize: function() {
        var label = this.getScaleLabel();
        label.setTpl(Ext.create('Ext.XTemplate',
           '{[futil.formatFloat(values.qty,Config.getQtyDecimals())]}'
        ));
    },  
    
    onStopScale: function() {
       this.stopScale();
    },
    
    onHide: function() {
        this.state = 0;
        this.getScaleView().setRecord(null);
        Ext.Viewport.fireEvent("validateLines");        
    },
       
    stopScale: function() {
        var self = this;  
        self.getScaleView().hide();
    },
    
    updateState: function() {
        var self = this;                     
        var record = self.getScaleView().getRecord();
        if ( record ) {
            if ( self.state === 1) {
                Config.scaleInit(self.price, self.tara)['catch'](function() {
                    // CONTINUE UPDATE
                    setTimeout(function() {
                        self.updateState();
                    }, self.timeout);
                }).then(function() {
                    // set state to weighing
                    self.state = 2;   
                    // CONTINUE UPDATE                 
                    setTimeout(function() {
                        self.updateState();
                    }, self.timeout);
                });
            } else if ( self.state === 2 ) {
                // weighing
                 Config.scaleRead()['catch'](function(err) {
                    // CONTINUE UPDATE
                    setTimeout(function() {
                        self.updateState();
                    }, self.timeout);
                }).then(function(result) {
                    // check price
                    if ( result.price.toFixed(2) != self.price.toFixed(2) ) {
                       // on wrong price init again
                       // REINIT
                       self.state = 1;
                    } else {
                        // SET VALUES
                        record.set('qty', result.weight);
                        record.set('subtotal_incl',result.total);                      
                    }                    
                    // CONTINUE UPDATE
                    setTimeout(function() {
                        self.updateState();
                    }, self.timeout);                    
                });        
            }
        }
    },
    
    startScale: function() {
        var self = this;
        var record = this.getScaleView().getRecord();
        if ( record ) {
            // set price data
            self.price = record.get('brutto_price');
            self.tara = 0.0;
            
            // create interval if it no exist
            if ( self.state === 0 ) {
                setTimeout(function() {
                    self.updateState();
                }, self.timeout);
            }
            
            // reset state to init
            self.state = 1;
            
        } else {
            self.price = 0.0;
            self.tara = 0.0;
        }
    }
    
});