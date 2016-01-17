/*global Ext:false*/

Ext.define('Fpos.view.OrderView', {
    extend: 'Ext.Panel',    
    xtype: 'fpos_order',
    requires: [
      'Ext.view.ScrollList'
    ],
    config: {
        cls: 'Receipt',
        layout: 'vbox',
        items: [
            {
                xtype: 'scrolllist',
                flex : 1,   
            }
        ]
    }    
});