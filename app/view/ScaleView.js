/*global Ext:false*/

Ext.define('Fpos.view.ScaleView', {
    extend: 'Ext.Panel',    
    xtype: 'fpos_scale',
    id: 'scaleView',
    requires: [
        'Ext.form.FieldSet', 
        'Ext.SingleTouchButton',
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
                        xtype: 'sbutton',
                        text: 'Tara',    
                        id: 'taraButton',
                        width: '200px',
                        height: '77px',  
                        ui: 'posInputButtonGreen',
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