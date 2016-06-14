/*global Ext:false*/

Ext.define('Fpos.view.OrderInputViewPhone', {
    extend: 'Ext.Panel',    
    xtype: 'fpos_order_input_phone',
    requires: [
        'Ext.Button'
    ],
    config: {
        cls: 'PosInputContainer',
        layout: 'vbox',
        items: [
            {
                layout: 'hbox',
                items: [
                    {
                        xtype: 'button',
                        text: 'P',
                        id: 'productMenuButton',
                        action: 'productMenu',
                        ui: 'posInputButtonOrange',
                        cls : 'PosInputButton',
                        flex: 1,
                        height: '56px'
                    },
                    {
                        xtype: 'button',
                        text: '+/-',    
                        action: 'inputNumber',
                        flex: 1,
                        height: '56px',  
                        ui: 'posInputButtonBlack',
                        cls : 'PosInputButtonSmallFont'
                    },                           
                    {
                        xtype: 'button',
                        text: '*',    
                        action: 'inputModeSwitch',
                        flex: 1,
                        height: '56px',  
                        ui: 'posInputButtonGray',
                        id: 'inputButtonAmount',
                        cls : 'PosInputButton'
                    },
                    {
                        xtype: 'button',
                        text: '%',
                        action: 'inputModeSwitch',
                        flex: 1,
                        height: '56px',  
                        ui: 'posInputButtonBlack',
                        id: 'inputButtonDiscount',
                        cls : 'PosInputButton'
                    },                            
                    {
                        xtype: 'button',
                        text: '€',    
                        action: 'inputModeSwitch',
                        flex: 1,
                        height: '56px',  
                        ui: 'posInputButtonBlack',
                        id: 'inputButtonPrice',
                        cls : 'PosInputButton'
                    }                       
                ]
            },
            {
                layout: 'hbox',
                items: [
                    {
                        xtype: 'button',
                        text: '7',    
                        action: 'inputNumber',
                        flex: 1,
                        height: '56px',  
                        ui: 'posInputButtonBlack',
                        cls : 'PosInputButton'
                    },
                    {
                        xtype: 'button',
                        text: '8',    
                        action: 'inputNumber',
                        flex: 1,
                        height: '56px',  
                        ui: 'posInputButtonBlack',
                        cls : 'PosInputButton'
                    },                        
                    {
                        xtype: 'button',
                        text: '9',    
                        action: 'inputNumber',
                        flex: 1,
                        height: '56px',  
                        ui: 'posInputButtonBlack',
                        cls : 'PosInputButton'
                    },
                    {
                        xtype: 'button',
                        iconCls: 'compose',
                        action: 'editOrder',
                        flex: 1,
                        height: '56px',  
                        ui: 'posInputButtonBlack',
                        cls : 'PosInputButton'
                    },                         
                    {
                        xtype: 'button',
                        iconCls: 'delete',
                        action: 'inputCancel',
                        flex: 1,
                        height: '56px',  
                        ui: 'posInputButtonRed',
                        cls : 'PosInputButton'
                    }                
                ]
            },
            {
                layout: 'hbox',
                items: [
                     {
                        xtype: 'button',
                        text: '4',    
                        action: 'inputNumber',
                        flex: 1,
                        height: '56px',  
                        ui: 'posInputButtonBlack',
                        cls : 'PosInputButton'
                    },
                    {
                        xtype: 'button',
                        text: '5',    
                        action: 'inputNumber',
                        flex: 1,
                        height: '56px',    
                        ui: 'posInputButtonBlack',
                        cls : 'PosInputButton'
                    },                       
                   {
                        xtype: 'button',
                        text: '6',    
                        action: 'inputNumber',
                        flex: 1,
                        height: '56px',    
                        ui: 'posInputButtonBlack',
                        cls : 'PosInputButton'
                    },
                    {
                        xtype: 'button',
                        text: '.',    
                        action: 'inputNumber',
                        flex: 1,
                        height: '56px',    
                        ui: 'posInputButtonBlack',
                        cls : 'PosInputButton'
                    },                   
                    {
                        xtype: 'button',
                        iconCls: 'action',
                        action: 'inputPayment',
                        flex: 1,
                        height: '56px',   
                        id: 'inputButtonPayment',
                        ui: 'posInputButtonOrange',
                        cls : 'PosInputButton'
                    }        
                ]
            },
             {
                layout: 'hbox',
                items: [
                     {
                        xtype: 'button',
                        text: '1',    
                        action: 'inputNumber',
                        flex: 1,
                        height: '56px',  
                        ui: 'posInputButtonBlack',
                        cls : 'PosInputButton'
                    },
                    {
                        xtype: 'button',
                        text: '2',    
                        action: 'inputNumber',
                        flex: 1,
                        height: '56px',    
                        ui: 'posInputButtonBlack',
                        cls : 'PosInputButton'
                    },                       
                   {
                        xtype: 'button',
                        text: '3',    
                        action: 'inputNumber',
                        flex: 1,
                        height: '56px',    
                        ui: 'posInputButtonBlack',
                        cls : 'PosInputButton'
                    },
                    {
                        xtype: 'button',
                        text: '0',    
                        action: 'inputNumber',
                        flex: 1,
                        height: '56px',    
                        ui: 'posInputButtonBlack',
                        cls : 'PosInputButton'
                    },                   
                    {
                        xtype: 'button',
                        iconCls: 'action',   
                        action: 'inputCash',
                        flex: 1,
                        height: '56px',    
                        ui: 'posInputButtonGreen',
                        cls : 'PosInputButton'
                    }  
                ]
            }
        ]
    }    
});