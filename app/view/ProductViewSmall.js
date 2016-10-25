/*global Ext:false*/

Ext.define('Fpos.view.ProductViewSmall', {
    extend: 'Ext.Panel',    
    xtype: 'fpos_product_small',
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
                        layout: "hbox",
                        flex: 1,
                        items: [
                            {        
                                xtype: 'dataview',
                                cls: 'CategorySelection',
                                useComponents: true,
                                maxItemCache: 33,
                                id: 'categoryDataView',                              
                                defaultType: 'fpos_category_item',
                                hidden: true,
                                store: 'CategoryStore'
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