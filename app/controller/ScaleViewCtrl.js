/*global Ext:false, DBUtil:false, PouchDB:false, openerplib:false, futil:false, Fpos:false, Config:false, ViewManager:false */
Ext.define('Fpos.controller.ScaleViewCtrl', {
    extend: 'Ext.app.Controller',
    requires: [    
        "Ext.Viewport",
        ""
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
            'button[action=startScale]': {
                tap: 'onStartScale'  
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
    
    scaleLabelInitialize: function() {
        var label = this.getScaleLabel();
        label.setTpl(Ext.create('Ext.XTemplate',
           '{[futil.formatFloat(values.qty,Config.getQtyDecimals())]}'
        ));
    },  
    
    onStopScale: function() {
        this.getScaleView().hide();
    },
    
    onHide: function() {
        this.getScaleView().setRecord(null);
        Ext.Viewport.fireEvent("validateLines");        
    },
    
    onStartScale: function() {
        this.startScale();
    },  
    
    continueWeighing: function() {
        var self = this;
        setTimeout(400, function() {
            var record = self.getRecord();
            if ( record ) {
                Config.scaleRead()['catch'](function(err) {
                    self.continueWeighing();                  
                }).then(function(result) {
                    record.set('qty',result.weight);
                    record.set('brutto_price',result.price); 
                    record.set('subtotal_incl',result.total);
                    self.continueWeighing();
                });                
            }
        }); 
    },
    
    startScale: function() {
        var self = this;
        var record = this.getScaleView().getRecord();
        if ( record ) {
            // start weighing
            Config.scaleInit(record.get('brutto_price'), record.get('qty')).then(self.continueWeighing);
        }    
    }
    
});