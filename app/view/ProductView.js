/*global Ext:false*/

Ext.define('Fpos.view.ProductView', {
    extend: 'Ext.Panel',    
    xtype: 'fpos_product',
    id: 'productView',
    requires: [
        'Ext.field.Search',
        'Ext.DataView',
        'Fpos.view.CategoryItem',
        'Fpos.view.ProductItem'
    ],
    config: {
        layout: 'vbox',
        cls: 'ProductContainer',
        items: [
            {
                xtype: 'toolbar',
                ui: 'categoryToolbar',
                items: [
                    {
                        xtype: 'button',
                        iconCls: 'home',
                        cls: 'SelectedCategoryButton',
                        categoryId: null,
                        action: 'selectCategory'
                    },
                    {
                        xtype: 'button',                        
                        text: 'Sub1',
                        ui: 'back',
                        categoryId: null,
                        hidden: true,
                        id: 'categoryButton1',
                        action: 'selectCategory'
                    },       
                    {
                        xtype: 'button',
                        text: 'Sub2',
                        ui: 'back',
                        categoryId: null,
                        hidden: true,
                        id: 'categoryButton2',
                        action: 'selectCategory'
                    },
                    {
                        xtype: 'button',
                        text: 'Sub3',
                        ui: 'back',
                        categoryId: null,
                        hidden: true,
                        id: 'categoryButton3',
                        action: 'selectCategory'
                    },
                    {
                        flex: 1,
                        xtype: 'searchfield',
                        placeholder: 'Suche',
                        id: 'productSearch'
                    }
                ]                 
            },
            {
                layout: "hbox",
                flex: 1,
                items: [                   
                    {            
                        xtype: 'dataview',
                        useComponents: true,
                        cls: 'CategoryDataView',  
                        id: 'categoryDataView',                              
                        defaultType: 'fpos_category_item',
                        hidden: true,
                        store: "CategoryStore"
                    },
                    {
                        cls: 'ProductDataView',
                        xtype: 'dataview',
                        useComponents: true,
                        defaultType: 'fpos_product_item',
                        flex: 1,    
                        store: "ProductStore"            
                    }                 
                ]
            }
        ]
    },
    
    updateRecord: function(oldRecord, newRecord) {
        var self = this;
        self.callParent(arguments);
    },
    
    search: function() {
        
    }
    
});