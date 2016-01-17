/*global Ext:false*/

Ext.define('Fpos.view.ProductView', {
    extend: 'Ext.Panel',    
    xtype: 'fpos_product',
    requires: [
        'Ext.field.Search'
    ],
    config: {
        layout: 'vbox',
        items: [
            {
                xtype: 'toolbar',
                items: [
                    {
                        xtype: 'button',
                        iconCls: 'home'                        
                    },
                    {
                        xtype: 'component',
                        flex: 1                        
                    },
                    {
                        xtype: 'searchfield',
                        placeholder: 'Suche',
                        width: '200px'
                    }
                ]                 
            },
            {
                 xtype: 'toolbar',
                 hidden: 'true',                 
                 items: [
                 
                 ]                 
            }, 
            {
                cls: 'ProductContainer',
                xtype: 'panel',
                flex: 1
            }
        ]
    }
    
});