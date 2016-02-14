/*global Ext:false, DBUtil:false, PouchDB:false, openerplib:false, futil:false, Fpos:false, Config:false, ViewManager:false */
Ext.define('Fpos.controller.ScaleViewCtrl', {
    extend: 'Ext.app.Controller',
    requires: [    
    ],
    config: {
        refs: {
            scaleView: '#scaleView'
        },
        control: {
            'button[action=stopScale]': {
                tap: 'onStopScale'
            }, 
            scaleView: {
                startScale: 'startScale'
            }               
        }
    },

    onStopScale: function() {
        this.getScaleView().hide();
    },
    
    stopScale: function() {
    },
    
    startScale: function() {
        
    }
    
});