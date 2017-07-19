/*global Ext:false*/

Ext.define('Fpos.view.TestView', {
    extend: 'Ext.Panel',    
    xtype: 'fpos_test',
    id: 'testView',
    requires: [
      'Ext.SingleTouchButton',
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
                        xtype: 'sbutton',
                        text: 'HW Iface',    
                        action: 'testInterface',
                        ui: 'posInputButtonBlack',
                        cls : 'TestButton'
                     },
                     {
                        xtype: 'sbutton',
                        text: 'Print',    
                        action: 'testPrint',
                        ui: 'posInputButtonBlack',
                        cls : 'TestButton'
                     },
                     {
                        xtype: 'sbutton',
                        text: 'POS Display',    
                        action: 'testDisplay',
                        ui: 'posInputButtonBlack',
                        cls : 'TestButton'
                     },
                     {
                        xtype: 'sbutton',
                        text: 'Cash Drawer',    
                        action: 'testCashdrawer',
                        ui: 'posInputButtonBlack',
                        cls : 'TestButton'
                     },
                     {
                        xtype: 'sbutton',
                        text: 'System Info',    
                        action: 'testInfo',
                        ui: 'posInputButtonBlack',
                        cls : 'TestButton'
                     },
                     {
                        xtype: 'sbutton',
                        text: 'Delete DB',    
                        action: 'delDB',
                        ui: 'posInputButtonBlack',
                        cls : 'TestButton'
                     },
                     {
                         xtype: 'sbutton',
                         text: 'Reset Dist',
                         action: 'resetDistDB',
                         ui: 'posInputButtonBlack',
                         cls : 'TestButton'
                     },
                     {
                        xtype: 'sbutton',
                        text: 'Reset DB',    
                        action: 'resetDB',
                        ui: 'posInputButtonBlack',
                        cls : 'TestButton'
                     },
                     {
                        xtype: 'sbutton',
                        text: 'Test Payworks',    
                        action: 'testPayworks',
                        ui: 'posInputButtonBlack',
                        cls : 'TestButton'
                     },
                     {
                        xtype: 'sbutton',
                        text: 'Payworks Init',    
                        action: 'testPayworksInit',
                        ui: 'posInputButtonBlack',
                        cls : 'TestButton'
                     },
                     {
                         xtype: 'sbutton',
                         text: 'Test Prov',
                         action: 'testProvisioning',
                         ui: 'posInputButtonBlack',
                         cls: 'TestButton'
                     },
                     {
                         xtype: 'sbutton',
                         text: 'Test Card',
                         action: 'testCard',
                         ui: 'posInputButtonBlack',
                         cls: 'TestButton'
                     },
                     {
                         xtype: 'sbutton',
                         text: 'Test Beep',
                         action: 'testBeep',
                         ui: 'posInputButtonBlack',
                         cls: 'TestButton'
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