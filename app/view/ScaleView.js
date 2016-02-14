/*global Ext:false*/

Ext.define('Fpos.view.ScaleView', {
    extend: 'Ext.Panel',    
    xtype: 'fpos_scale',
    requires: [
        'Ext.form.FieldSet', 
        'Ext.Button',
        'Ext.Container',
        'Ext.Label'
    ],
    config: {        
        layout: 'vbox',     
        items: [
            {
                cls: 'ScaleLabel',
                xtype: 'label',
                height: '100px'                                
            },
            {
                cls: 'ScaleInput', 
                layout: 'vbox',
                items: [
                    {
                        xtype: 'button',
                        text: 'Übernehmen',    
                        action: 'scaleInput',
                        width: '200px',
                        height: '77px',  
                        ui: 'posInputButtonGreen',
                        cls : 'PosInputButtonOther'
                    },
                    {
                        xtype: 'button',
                        text: 'Tara',    
                        action: 'scaleSetTara',
                        width: '200px',
                        height: '77px',  
                        ui: 'posInputButtonBlack',
                        cls : 'PosInputButtonOther'
                    }
                ]
            }                
        ]
    }
    
});