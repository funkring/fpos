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
                        label: 'E-Mail',
                        autoComplete: false,
                        autoCorrect: false,
                        autoCapitalize: false
                    },
                    {
                        xtype: 'textfield',
                        name: 'mobile',
                        label: 'Mobil',
                        autoComplete: false,
                        autoCorrect: false,
                        autoCapitalize: false
                    },
                    {
                        xtype: 'textfield',
                        name: 'phone',
                        label: 'Telefon',
                        autoComplete: false,
                        autoCorrect: false,
                        autoCapitalize: false
                    },
                    {
                        xtype: 'textfield',
                        name: 'fax',
                        label: 'Fax',
                        autoComplete: false,
                        autoCorrect: false,
                        autoCapitalize: false
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
                        label: 'PLZ',
                        autoComplete: false,
                        autoCorrect: false,
                        autoCapitalize: false
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