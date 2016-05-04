/*global Ext:false*/
Ext.define("Fpos.view.PlaceItem", {
    extend: 'Ext.dataview.component.DataItem',
    requires: ['Ext.XTemplate'],
    xtype: 'fpos_place_item',
    config: {       
        items: [{
            cls: 'PlaceButton',
            xtype: 'button',
            action: 'selectPlace',
            ui: 'posInputButtonWhite'
        }]
    },
    
    updateRecord: function(record) {        
        var self = this;
        var button = self.down('button');
        if ( button ) {
            // set color
            var ui = 'posInputButtonWhite';
            var color = record.get('pos_color');
            var cls = 'PlaceButton';
            if ( color ) {
                if ( color !== 'white' && color !== 'yellow') {
                    cls = 'PlaceButtonDark';
                }
                ui = 'posInputButton-'+color;
            }           
             
            if ( button.getUi() !== ui ) {
                button.setUi(ui);
            }
            
            if ( button.getCls() != cls ) {
                button.setCls(cls);
            }
        
            button.setRecord(record);
        }
    }
    
});