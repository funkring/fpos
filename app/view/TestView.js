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
                items: [
                    {
                        xtype: 'button',
                        text: 'Test Interface',    
                        action: 'testInterface',
                        width: '250px',
                        height: '77px',  
                        ui: 'posInputButtonBlack',
                        cls : 'TestButton'
                     },
                     {
                        xtype: 'button',
                        text: 'Test Print',    
                        action: 'testPrint',
                        width: '250px',
                        height: '77px',  
                        ui: 'posInputButtonBlack',
                        cls : 'TestButton'
                     },
                     {
                        xtype: 'button',
                        text: 'Test Display',    
                        action: 'testDisplay',
                        width: '250px',
                        height: '77px',  
                        ui: 'posInputButtonBlack',
                        cls : 'TestButton'
                     },
                     {
                        xtype: 'button',
                        text: 'Test Cashdrawer',    
                        action: 'testCashdrawer',
                        width: '250px',
                        height: '77px',  
                        ui: 'posInputButtonBlack',
                        cls : 'TestButton'
                     },
                     {
                        xtype: 'button',
                        text: 'Test Database',    
                        action: 'testDB',
                        width: '250px',
                        height: '77px',  
                        ui: 'posInputButtonBlack',
                        cls : 'TestButton'
                     },
                     {
                        xtype: 'button',
                        text: 'Delete Database',    
                        action: 'delDB',
                        width: '250px',
                        height: '77px',  
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