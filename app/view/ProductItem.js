/*global Ext:false*/
Ext.define("Fpos.view.ProductItem", {
    extend: 'Ext.dataview.component.DataItem',
    requires: ['Ext.XTemplate'],
    xtype: 'fpos_product_item',
    config: {       
        items: [{
            cls: 'ProductButton',
            xtype: 'button',
            action: 'selectProduct',
            productId: null,
            ui: 'posInputButtonWhite',
        }]
    },
    
    updateRecord: function(record) {        
        var self = this;
        var button = self.down('button');
        button.setRecord(record);
    }
    
});