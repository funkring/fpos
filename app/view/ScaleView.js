/*global Ext:false*/

Ext.define('Fpos.view.ScaleView', {
    extend: 'Ext.Panel',    
    xtype: 'fpos_scale',
    id: 'scaleView',
    requires: [
        'Ext.form.FieldSet', 
        'Ext.Button',
        'Ext.Container',
        'Ext.Label'
    ],
    config: {        
        record: null,
        layout: 'vbox',     
        items: [
            {
                cls: 'ScaleLabel',
                xtype: 'label',
                id: 'scaleLabel'                              
            },
            {
                cls: 'ScaleInput', 
                layout: 'vbox',
                items: [
                    {
                        xtype: 'button',
                        text: 'Tara',    
                        action: 'scaleTara',
                        width: '200px',
                        height: '77px',  
                        ui: 'posInputButtonBlack',
                        cls : 'PosInputButtonOther'
                    }
                ]
            }                
        ]
    },
    
    updateRecord: function(record) {
        var label = this.getComponent("scaleLabel");
        label.setRecord(record);
        return this.callParent(arguments);
    },
    
    startScale: function() {
        this.fireEvent("startScale");   
    }       
});