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
                layout: "hbox",
                flex: 1,
                items: [                   
                    {        
                        xtype: 'dataview',
                        cls: 'CategorySelection',
                        useComponents: true,
                        maxItemCache: 21,
                        id: 'categoryDataView',                              
                        defaultType: 'fpos_category_item',
                        hidden: true,
                        store: 'CategoryStore'
                    },
                    {
                        layout: "vbox",
                        flex: 1,
                        items: [
                            {
                                xtype: 'toolbar',
                                ui: 'categoryToolbar',
                                id: 'categoryToolbar',
                                items: [
                                    {
                                        flex: 1,
                                        xtype: 'searchfield',
                                        placeholder: 'Suche',
                                        id: 'productSearch'
                                    }
                                ]                 
                            },
                            {
                                cls: 'ProductDataView',
                                id: 'productDataView',
                                xtype: 'dataview',
                                useComponents: true,
                                maxItemCache: 66,
                                scrollable: 'vertical',
                                defaultType: 'fpos_product_item',
                                flex: 1,    
                                store: "ProductStore"        
                            }
                        ]
                          
                    }                 
                ]
            }
        ]
    }
    
});