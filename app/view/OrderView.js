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
                       id: 'posDisplayState',
                       cls: 'PosDisplayState'                      
                    },
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
                id: 'orderItemList',
                cls: 'Receipt',
                itemCls: 'PosOrderItem',
                flex : 1,
                allowDeselect: true
            }
        ]
    }    
});