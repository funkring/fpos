/*global Ext:false*/

Ext.define('Fpos.view.OrderView', {
    extend: 'Ext.Panel',    
    xtype: 'fpos_order',
    requires: [
      'Ext.view.ScrollList',
      'Ext.Label'
    ],
    config: {        
        layout: 'vbox',
        items: [
             {
                xtype: 'toolbar',
                ui: 'posStatusBar',                
                cls: 'PosStatusBar',
                items: [
                    {
                       xtype: 'label',
                       html: '0 €',
                       cls: 'PosDisplayLabel',
                       flex: 1
                    }
                ]                 
            },            
            {
                xtype: 'scrolllist',
                cls: 'Receipt',
                flex : 1
            }
        ]
    }    
});