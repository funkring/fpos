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
        var self = this;
        var button = self.down('button');
        var name = record.get('name') || '';
        
        // config text
        if ( name.length >= 7) {
            button.setCls('ProductCategoryButtonSmall');
        } else if ( name.length > 5) {
            button.setCls('ProductCategoryButtonMedium');
        } else {
            button.setCls('ProductCategoryButton');
        }
        
        // config ui
        if ( record.get('parent') ) {
            button.setUi('posInputButtonOrange');
            button.categoryId = record.get('parent_id');
        } else if ( record.get('selected') ) {
            button.setUi('posInputButtonGray');
            button.categoryId = record.getId();
        } else {
            button.setUi('posInputButtonBlack');
            button.categoryId = record.getId();                      
        }
        
        // text
        button.setText(name);
    }
    
});