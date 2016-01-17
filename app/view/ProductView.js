/*global Ext:false*/

Ext.define('Fpos.view.ProductView', {
    extend: 'Ext.Panel',    
    xtype: 'fpos_product',
    requires: [
    ],
    config: {
        items: [
            {
                xtype: 'toolbar',
                docked : 'top',
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
                 docked: 'top',
                 hidden: 'true',
                 items: [
                 
                 ]                 
            }, 
            {
                xtype: 'panel'
            }
        ]
    }
    
});