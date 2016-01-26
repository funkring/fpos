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
        button.setText(record.get('name'));
        button.categoryId = record.getId();
    }
    
});