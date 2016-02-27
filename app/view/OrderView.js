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
                id: 'orderInputView',
                layout: 'card',
                xtype: 'panel',
                flex : 1,
                items: [
                    {
                        xtype: 'scrolllist',
                        id: 'orderItemList',
                        cls: 'Receipt',
                        itemCls: 'PosOrderItem',
                        allowDeselect: true
                    },
                    {
                        layout: 'vbox',
                        xtype: 'panel',
                        id: 'paymentPanel',
                        items: [
                            {
                                id: 'paymentItemList',
                                itemCls: 'PaymentListItem',
                                xtype: 'scrolllist',
                                flex: 1
                            }, 
                            {
                                id: 'paymentSummary',
                                cls: 'PaymentSummary',
                                xtype: 'label'
                            }
                        ]
                    }
                   
                ]
            }
        ]
    }    
});