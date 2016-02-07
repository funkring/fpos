/*global Ext:false*/

Ext.define('Fpos.view.OrderFormView', {
    extend: 'Ext.form.FormPanel',    
    xtype: 'fpos_order_form',
    requires: [
        'Ext.form.FieldSet', 
        'Ext.field.Text',
        'Ext.field.Hidden',
        'Ext.field.TextArea',
        'Fpos.view.PartnerListSelect'
    ],
    config: {
        scrollable: true,
        saveable: true,
        items: [
            {
                xtype: 'fieldset',
                title: 'Belegdaten',
                items: [
                    {
                        xtype: 'textfield',
                        name: 'ref',
                        label: 'Beleg/Referenz'
                    },
                    {
                        xtype: 'fpos_partner_select',
                        name: 'partner_id',
                        label: 'Kunde'
                    },
                    { 
                        xtype: 'textareafield',
                        name: 'note',
                        label: 'Notiz'
                    }
                ]   
            }
        ]
    }
    
});