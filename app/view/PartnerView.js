/*global Ext:false*/

Ext.define('Fpos.view.PartnerView', {
    extend: 'Ext.form.FormPanel',    
    requires: [
        'Ext.form.FieldSet', 
        'Ext.field.Text'    
    ],
    xtype: 'fpos_partner_form',    
    config: {
        scrollable: true,
        saveable: true,
        items: [
            {
                xtype: 'fieldset',
                title: 'Kontakt',
                items: [
                    {
                        xtype: 'textfield',
                        name: 'name',
                        label: 'Name',
                        required: true
                    },
                    {
                        xtype: 'textfield',
                        name: 'email',
                        label: 'E-Mail'
                    },
                    {
                        xtype: 'textfield',
                        name: 'mobile',
                        label: 'Mobil'
                    },
                    {
                        xtype: 'textfield',
                        name: 'phone',
                        label: 'Telefon'
                    },
                    {
                        xtype: 'textfield',
                        name: 'fax',
                        label: 'Fax'
                    }
                ]   
            },
            {
               xtype: 'fieldset',
               title: 'Adresse',
               items: [
                    {
                        xtype: 'textfield',
                        name: 'street',
                        label: 'Straße'                    
                    },
                    {
                        xtype: 'textfield',
                        name: 'street2',
                        label: 'Straße2'
                    },                
                    {
                        xtype: 'textfield',
                        name: 'zip',
                        label: 'PLZ'
                    },
                    {
                        xtype: 'textfield',
                        name: 'city',
                        label: 'Ort'
                    }
               ] 
            }            
        ]       
    }
    
});