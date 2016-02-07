/*global Ext:false*/

Ext.define('Fpos.view.OrderLineFormView', {
    extend: 'Ext.form.FormPanel',    
    xtype: 'fpos_line_form',
    requires: [
        'Ext.form.FieldSet', 
        'Ext.field.Text',
        'Ext.field.TextArea'
    ],
    config: {
        scrollable: true,
        saveable: true,
        items: [
            {
                xtype: 'fieldset',
                title: 'Position',
                items: [                  
                    {
                        xtype: 'textfield',
                        name: 'name',
                        label: 'Name',
                        required: true
                    },
                    {
                        xtype: 'textareafield',
                        name: 'notice',
                        label: 'Notiz'
                    }
                ]   
            }
        ]
    }
    
});