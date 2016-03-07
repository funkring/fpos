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
            }
        ]
    }    
});