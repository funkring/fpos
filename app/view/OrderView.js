/*global Ext:false*/

Ext.define('Fpos.view.OrderView', {
    extend: 'Ext.Panel',    
    xtype: 'fpos_order',
    id: 'orderView',
    requires: [
      'Ext.view.ScrollList',
      'Ext.Label',
      'Ext.Toolbar' 
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
                       id: 'posDisplayLabel',                       
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