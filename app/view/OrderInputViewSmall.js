/*global Ext:false*/

Ext.define('Fpos.view.OrderInputViewSmall', {
    extend: 'Ext.Panel',    
    xtype: 'fpos_order_input_small',
    requires: [
        'Ext.Button'
    ],
    config: {
        cls: 'PosInputContainer',
        items: [
            {
                layout: 'vbox',
                items: [
                    {
                        layout: 'hbox',
                        items: [
                            {
                                xtype: 'button',
                                text: '+/-',    
                                action: 'inputNumber',
                                width: '92px',
                                height: '77px',  
                                ui: 'posInputButtonBlack',
                                cls : 'PosInputButton'
                            },                           
                            {
                                xtype: 'button',
                                iconCls: 'compose',
                                action: 'editOrder',
                                width: '92px',
                                height: '77px',  
                                ui: 'posInputButtonBlack',
                                cls : 'PosInputButton'
                            },
                            {
                                xtype: 'button',
                                iconCls: 'action',
                                action: 'inputPayment',
                                width: '91px',
                                height: '77px',  
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
                                text: '*',    
                                action: 'inputModeSwitch',
                                width: '92px',
                                height: '77px',  
                                ui: 'posInputButtonGray',
                                id: 'inputButtonAmount',
                                cls : 'PosInputButton'
                            },
                            {
                                xtype: 'button',
                                text: '%',
                                action: 'inputModeSwitch',
                                width: '92px',
                                height: '77px',  
                                ui: 'posInputButtonBlack',
                                id: 'inputButtonDiscount',
                                cls : 'PosInputButton'
                            },                            
                            {
                                xtype: 'button',
                                text: '€',    
                                action: 'inputModeSwitch',
                                width: '92px',
                                height: '77px',  
                                ui: 'posInputButtonBlack',
                                id: 'inputButtonPrice',
                                cls : 'PosInputButton'
                            }
                        ]
                    }
                ]
            }
        ]
    }    
});