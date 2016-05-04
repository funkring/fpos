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
            ui: 'posInputButtonWhite'
        }]
    },
    
    updateRecord: function(record) {        
        var self = this;
        var button = self.down('button');
        if ( button ) {     
            var ui = 'posInputButtonWhite';
            var color = record.get('pos_color');
            var cls = 'ProductButton';
            if ( color ) {
                if ( color !== 'white' && color !== 'yellow') {
                    cls = 'ProductButtonDark';
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