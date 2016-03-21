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
            'button[action=scaleTara]': {
                tap: 'onTara'
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
        // states
        this.STATE_INIT = 0;
        this.STATE_INIT_PRICE = 1;
        this.STATE_WEIGHING = 2;
        
        // vars
        this.timeout = 250;
        this.nextTara = false;
        this.state = this.STATE_INIT;
    },
    
    scaleLabelInitialize: function() {
        var label = this.getScaleLabel();
        label.setTpl(Ext.create('Ext.XTemplate',
           '<tpl if="tara">',
           '{[futil.formatFloat(values.qty,Config.getQtyDecimals())]}',
           '<br/>',
           'Tara {[futil.formatFloat(values.tara,Config.getQtyDecimals())]}',
           '<tpl else>',
           '{[futil.formatFloat(values.qty,Config.getQtyDecimals())]}',
           '</tpl>'
        ));
    },  
    
    onTara: function() {
        this.nextTara = true;
    },
    
    onStopScale: function() {
       this.stopScale();
    },
    
    onHide: function() {
        var self = this;
        self.state = self.STATE_INIT;
        self.nextTara = false;
        self.getScaleView().setRecord(null);
        Ext.Viewport.fireEvent("validateLines");        
    },
       
    stopScale: function() {
        var self = this;  
        self.getScaleView().hide();
    },
    
    nextState: function() {
       var self = this;
       // CONTINUE UPDATE
       setTimeout(function() {
            self.updateState();
       }, self.timeout);   
    },
    
    updateState: function() {
        var self = this;                     
        var record = self.getScaleView().getRecord();
        if ( record ) {
            if ( self.state === self.STATE_INIT_PRICE ) {
                var price = record.get('brutto_price') || 0.0;
                var tara = record.get('tara') || 0.0;
                Config.scaleInit(price, tara)['catch'](function() {
                    // continue
                    self.nextState();
                }).then(function() {
                    // set state to weighing
                    self.state = self.STATE_WEIGHING;   
                    // continue               
                    self.nextState();
                });
            } else if ( self.state === self.STATE_WEIGHING ) {
                // weighing
                 Config.scaleRead()['catch'](function(err) {
                    // continue
                    self.nextState();
                }).then(function(result) {
                    // check price
                    if ( result.price.toFixed(2) != self.price.toFixed(2) ) {
                       // on wrong price init again
                       // REINIT
                       self.state = self.STATE_INIT_PRICE;
                       // continue
                       self.nextState();
                    } else {
                        // check if tara option
                        if ( self.nextTara ) {
                            // handle tara
                            self.nextTara = false;
                            record.set('tara', result.weight);
                            self.state = self.STATE_INIT_PRICE;
                            self.nextState();
                        } else {
                            // SET VALUES and FINISH
                            record.set('qty', result.weight);
                            record.set('subtotal_incl',result.total);
                            self.stopScale();
                        }   
                    }                    
                                   
                });        
            }
        }
    },
    
    startScale: function() {
        var self = this;
        var record = this.getScaleView().getRecord();        
        if ( record ) {
            // reset tara
            self.nextTara = false;
            if ( record.get('tara') ) {
                record.set('tara',0.0);
            }
            
            // create interval if it not exist
            if ( self.state === self.STATE_INIT ) {
                self.nextState();
            }
            
            // reset state to init
            self.state = self.STATE_INIT_PRICE;
        }
    }
    
});