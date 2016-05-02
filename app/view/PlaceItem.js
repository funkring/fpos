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
        if ( button )
            button.setRecord(record);
    }
    
});