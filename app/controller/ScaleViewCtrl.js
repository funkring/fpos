/*global Ext:false, DBUtil:false, PouchDB:false, openerplib:false, futil:false, Fpos:false, Config:false, ViewManager:false */
Ext.define('Fpos.controller.ScaleViewCtrl', {
    extend: 'Ext.app.Controller',
    requires: [    
        'Ext.Button',
        'Ext.Label',
        'Fpos.Config'
    ],
    config: {
        refs: {
            scaleView: '#scaleView',
            scaleLabel: '#scaleLabel',
            taraButton: '#taraButton'
        },
        control: {
            taraButton: {
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
        this.timeout = 500;
        this.nextTara = false;
        this.state = this.STATE_INIT;
    },
    
    scaleLabelInitialize: function() {
        var label = this.getScaleLabel();
        label.setTpl(Ext.create('Ext.XTemplate',
           '<tpl if="tara">',
           '<div class="ScaleLabelTara">',
                '<div>Tara</div>',
                '<div>{[futil.formatFloat(values.tara,Config.getQtyDecimals())]}</div>',
           '</div>',
           '</tpl>',
           '<div class="ScaleLabelWeight">',
                '{[futil.formatFloat(values.qty,Config.getQtyDecimals())]}',
           '</div>'           
        ));
    },  
    
    onTara: function() {
        this.nextTara = true;
        this.getTaraButton().setUi("posInputButtonBlack");
    },
    
    onHide: function() {
        var self = this;
        self.state = self.STATE_INIT;
        self.getScaleView().setRecord(null);
        Ext.Viewport.fireEvent("validateLines");        
    },
       
    foundWeight: function() {
        var self = this;
        self.getScaleView().setRecord(null);
        self.getScaleView().hide();
        Config.beep();
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
                var price = record.get('price') || 0.0;
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
                    var price = record.get('price');
                    if ( result.price.toFixed(2) != price.toFixed(2) ) {
                       // on wrong price init again
                       // REINIT
                       self.state = self.STATE_INIT_PRICE;
                       // continue
                       self.nextState();
                    } else {
                        // check if tara option
                        if ( self.nextTara ) {
                            // handle tara
                            if ( result.weight > 0 ) {
                                self.nextTara = false;
                                record.set('tara', result.weight);
                                self.state = self.STATE_INIT_PRICE;
                            }
                            // continue
                            self.nextState();
                        } else {
                            // SET VALUES and FINISH
                            if ( result.weight > 0) {
                                record.set('qty', result.weight);
                                record.set('subtotal_incl',result.total);                            
                                self.foundWeight();
                            } else {
                                //continue if no value
                                self.nextState();
                            }
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
            // init tara
            self.getTaraButton().setUi("posInputButtonGreen");
            self.nextTara = false;
            
            // create interval if it not exist            
            if ( self.state === self.STATE_INIT ) {
                self.nextState();
            }
            
            // enter into price state
            self.state = self.STATE_INIT_PRICE;
        }
    }
    
});