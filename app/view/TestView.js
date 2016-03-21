/*global Ext:false*/

Ext.define('Fpos.view.TestView', {
    extend: 'Ext.Panel',    
    xtype: 'fpos_test',
    id: 'testView',
    requires: [
      'Ext.Button',
      'Ext.Label'
    ],
    config: {        
        layout: 'hbox',
        items: [
             {
                xtype: 'panel',
                layout: 'vbox',
                cls: 'TestContainer',
                width: '76px',
                scrollable: 'vertical',
                items: [
                    {
                        xtype: 'button',
                        text: 'HW Iface',    
                        action: 'testInterface',
                        ui: 'posInputButtonBlack',
                        cls : 'TestButton'
                     },
                     {
                        xtype: 'button',
                        text: 'Print',    
                        action: 'testPrint',
                        ui: 'posInputButtonBlack',
                        cls : 'TestButton'
                     },
                     {
                        xtype: 'button',
                        text: 'POS Display',    
                        action: 'testDisplay',
                        ui: 'posInputButtonBlack',
                        cls : 'TestButton'
                     },
                     {
                        xtype: 'button',
                        text: 'Cash Drawer',    
                        action: 'testCashdrawer',
                        ui: 'posInputButtonBlack',
                        cls : 'TestButton'
                     },
                     {
                        xtype: 'button',
                        text: 'System Info',    
                        action: 'testInfo',
                        ui: 'posInputButtonBlack',
                        cls : 'TestButton'
                     },
                     {
                        xtype: 'button',
                        text: 'Delete DB',    
                        action: 'delDB',
                        ui: 'posInputButtonBlack',
                        cls : 'TestButton'
                     },
                     {
                        xtype: 'button',
                        text: 'Reset DB',    
                        action: 'resetDB',
                        ui: 'posInputButtonBlack',
                        cls : 'TestButton'
                     }
                ]                 
            },            
            {
                xtype: 'label',
                id: 'testLabel',
                cls: 'TestInfo',
                flex : 1
            }
        ]
    }    
});