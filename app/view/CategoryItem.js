/*global Ext:false*/
Ext.define("Fpos.view.CategoryItem", {
    extend: 'Ext.dataview.component.DataItem',
    xtype: 'fpos_category_item',
    config: {       
        items: [{
            cls: 'ProductCategoryButton',
            ui: 'posInputButtonBlack',
            xtype: 'button',
            action: 'selectCategory',
            categoryId: null,
            text: ''            
        }]
    },
    
    updateRecord: function(record) {
        if ( record ) {
            var self = this;
            
            // get button
            var button = self.down('button');
                                    
            // config text
            var name = record.get('name') || '';
            if ( name.length > 5) {
                button.setCls('ProductCategoryButtonSmall');
            } else if ( name.length > 4) {
                button.setCls('ProductCategoryButtonMedium');
            } else {
                button.setCls('ProductCategoryButton');
            }
            
            // config ui
            var ui = 'posInputButtonBlack';
            if ( record.get('parent') ) {
                ui = 'posInputButtonOrange';
                button.categoryId = record.get('parent_id');
            } else if ( record.get('selected') ) {
                ui = 'posInputButtonGray';
                button.categoryId = record.getId();
            } else {
                var color = record.get('pos_color');
                if ( color ) {
                    ui = 'posInputButton-'+color;
                }
                button.categoryId = record.getId();                      
            }
            if ( button.getUi() !== ui ) {
                button.setUi(ui);
            }
            
            // text
            button.setText(name);
        }
    }
    
});