/*global Ext:false*/
/*global Ext:false*/

Ext.define('Fpos.view.ScaleView', {
    extend: 'Ext.Panel',    
    xtype: 'fpos_scale',
    requires: [
        'Ext.form.FieldSet', 
        'Ext.field.Text',
        'Ext.field.Hidden',
        'Ext.field.TextArea',
        'Ext.field.Toggle',
        'Fpos.view.PartnerListSelect'
    ],
    config: {
        layout: 'vbox',
        items: [
            {
                cls: 'ScaleLabel',
                xtype: 'label'                
            },
            {
                layout: 'vbox',
                cls: 'ScaleInput',
                items: [
                    {
                        xtype: 'button',
                        text: 'Übernehmen',    
                        action: 'scaleInput',
                        width: '154px',
                        height: '77px',  
                        ui: 'posInputButtonGreen',
                        cls : 'PosInputButton'
                    },
                    {
                        xtype: 'button',
                        text: 'Tara',    
                        action: 'scaleSetTara',
                        width: '154px',
                        height: '77px',  
                        ui: 'posInputButtonBlack',
                        cls : 'PosInputButton'
                    },            
                    {
                        xtype: 'button',
                        text: 'Abbrechen',    
                        action: 'scaleCancel',
                        width: '154px',
                        height: '77px',  
                        ui: 'posInputButtonBlack',
                        cls : 'PosInputButton'
                    }
                ]
            }                
        ]
    }
    
});