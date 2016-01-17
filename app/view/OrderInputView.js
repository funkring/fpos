/*global Ext:false*/

Ext.define('Fpos.view.OrderInputView', {
    extend: 'Ext.Panel',    
    xtype: 'fpos_order_input',
    requires: [
        'Ext.Button'
    ],
    config: {
        cls: 'PosInputContainer',
        items: [
            {
                layout: 'hbox',
                items: [
                    {
                        layout: 'vbox',
                        items: [
                            {
                                xtype: 'button',
                                text: '7',    
                                action: 'inputNumber',
                                width: '77px',
                                height: '77px',  
                                ui: 'posInputButtonBlack',
                                cls : 'PosInputButton'
                            },
                            {
                                xtype: 'button',
                                text: '4',    
                                action: 'inputNumber',
                                width: '77px',
                                height: '77px',  
                                ui: 'posInputButtonBlack',
                                cls : 'PosInputButton'
                            },
                            {
                                xtype: 'button',
                                text: '1',    
                                action: 'inputNumber',
                                width: '77px',
                                height: '77px',  
                                ui: 'posInputButtonBlack',
                                cls : 'PosInputButton'
                            },
                            {
                                xtype: 'button',
                                text: '+/-',    
                                action: 'inputPlusMinus',
                                width: '77px',
                                height: '77px',  
                                ui: 'posInputButtonBlack',
                                cls : 'PosInputButton'
                            }
                        ]
                    },
                    {
                        layout: 'vbox',
                        items: [
                            {
                                xtype: 'button',
                                text: '8',    
                                action: 'inputNumber',
                                width: '77px',
                                height: '77px',  
                                ui: 'posInputButtonBlack',
                                cls : 'PosInputButton'
                            },
                            {
                                xtype: 'button',
                                text: '5',    
                                action: 'inputNumber',
                                width: '77px',
                                height: '77px',  
                                ui: 'posInputButtonBlack',
                                cls : 'PosInputButton'
                            },
                            {
                                xtype: 'button',
                                text: '2',    
                                action: 'inputNumber',
                                width: '77px',
                                height: '77px',  
                                ui: 'posInputButtonBlack',
                                cls : 'PosInputButton'
                            },
                            {
                                xtype: 'button',
                                text: '0',    
                                action: 'inputNumber',
                                width: '77px',
                                height: '77px',  
                                ui: 'posInputButtonBlack',
                                cls : 'PosInputButton'
                            }
                        ]
                    },
                    {
                        layout: 'vbox',
                        items: [
                            {
                                xtype: 'button',
                                text: '9',    
                                action: 'inputNumber',
                                width: '77px',
                                height: '77px',  
                                ui: 'posInputButtonBlack',
                                cls : 'PosInputButton'
                            },
                            {
                                xtype: 'button',
                                text: '6',    
                                action: 'inputNumber',
                                width: '77px',
                                height: '77px',  
                                ui: 'posInputButtonBlack',
                                cls : 'PosInputButton'
                            },
                            {
                                xtype: 'button',
                                text: '3',    
                                action: 'inputNumber',
                                width: '77px',
                                height: '77px',  
                                ui: 'posInputButtonBlack',
                                cls : 'PosInputButton'
                            },
                            {
                                xtype: 'button',
                                text: '.',    
                                action: 'addComma',
                                width: '77px',
                                height: '77px',  
                                ui: 'posInputButtonBlack',
                                cls : 'PosInputButton'
                            }
                        ]
                    },
                    {
                        layout: 'vbox',
                        items: [
                            {
                                xtype: 'button',
                                iconCls: 'compose',
                                action: 'inputMenu',
                                width: '77px',
                                height: '77px',  
                                ui: 'posInputButtonBlack',
                                cls : 'PosInputButton'
                            },
                            {
                                xtype: 'button',
                                text: '*',    
                                action: 'inputAmount',
                                width: '77px',
                                height: '77px',  
                                ui: 'posInputButtonGray',
                                cls : 'PosInputButton'
                            },
                            {
                                xtype: 'button',
                                text: '%',
                                action: 'inputDiscount',
                                width: '77px',
                                height: '77px',  
                                ui: 'posInputButtonGray',
                                cls : 'PosInputButton'
                            },                            
                            {
                                xtype: 'button',
                                text: '€',    
                                action: 'inputPrice',
                                width: '77px',
                                height: '77px',  
                                ui: 'posInputButtonGray',
                                cls : 'PosInputButton'
                            }
                        ]
                    },
                    {
                        layout: 'vbox',
                        items: [                            
                            {
                                xtype: 'button',
                                iconCls: 'delete',
                                action: 'inputCancel',
                                width: '77px',
                                height: '77px',  
                                ui: 'posInputButtonRed',
                                cls : 'PosInputButton'
                            },
                            {
                                xtype: 'button',
                                iconCls: 'action',
                                action: 'inputMenu',
                                width: '77px',
                                height: '77px',  
                                ui: 'posInputButtonOrange',
                                cls : 'PosInputButton'
                            },
                            {
                                xtype: 'button',
                                iconCls: 'action',   
                                action: 'inputBar',
                                width: '77px',
                                height: '156px',  
                                ui: 'posInputButtonGreen',
                                cls : 'PosInputButton'
                            }
                        ]
                    }
                ]
            }
        ]
    }    
});