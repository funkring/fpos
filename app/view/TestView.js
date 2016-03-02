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
                width: '77px',
                scrollable: 'vertical',
                items: [
                    {
                        xtype: 'button',
                        text: 'Test Interface',    
                        action: 'testInterface',
                        ui: 'posInputButtonBlack',
                        cls : 'TestButton'
                     },
                     {
                        xtype: 'button',
                        text: 'Test Print',    
                        action: 'testPrint',
                        ui: 'posInputButtonBlack',
                        cls : 'TestButton'
                     },
                     {
                        xtype: 'button',
                        text: 'Test Display',    
                        action: 'testDisplay',
                        ui: 'posInputButtonBlack',
                        cls : 'TestButton'
                     },
                     {
                        xtype: 'button',
                        text: 'Test Cashdrawer',    
                        action: 'testCashdrawer',
                        ui: 'posInputButtonBlack',
                        cls : 'TestButton'
                     },
                     {
                        xtype: 'button',
                        text: 'Systeminfo',    
                        action: 'testInfo',
                        ui: 'posInputButtonBlack',
                        cls : 'TestButton'
                     },
                     {
                        xtype: 'button',
                        text: 'Delete Database',    
                        action: 'delDB',
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