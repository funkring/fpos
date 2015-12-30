/*global Ext:false*/

Ext.define('Fpos.view.ConfigView', {
    extend: 'Ext.form.FormPanel',    
    xtype: 'fpos_config',
    requires: [
        'Ext.form.FieldSet', 
        'Ext.field.Text',
        'Ext.field.Password',
        'Ext.field.Hidden',
        'Ext.field.Number'     
    ],
    config: {
        scrollable: true,
        saveable: true,
        items: [
            {
                xtype: 'fieldset',
                title: 'Cloud',
                items: [
                    {
                        xtype: 'hiddenfield',
                        name: '_rev',
                        label: 'Version'
                    },
                    {
                        xtype: 'textfield',
                        name: 'host',
                        label: 'Server',
                        placeHolder: 'fpos.oerp.at',
                        required: true
                    },
                    {
                        xtype: 'textfield',
                        name: 'port',
                        label: 'Port',
                        placeHolder: '443',
                        required: true
                    },
                    {
                        xtype: 'textfield',
                        name: 'database',
                        label: 'Datenbank',
                        placeHolder: 'odoo_fpos_xxx',
                        required: true
                    },
                    {
                        xtype: 'textfield',
                        name: 'login',
                        label: 'Benutzer',
                        required: true,
                        autocomplete: false
                    },
                    {
                        xtype: 'passwordfield',
                        name: 'password',
                        label: 'Passwort',
                        required: true,
                        autocomplete: false
                    }                    
                ]   
            },
            {
                xtype: 'fieldset',
                title: 'Administrator',
                items: [
                    {
                        xtype: 'patternfield',
                        name: 'pin',
                        placeHolder: '0000',
                        label: 'PIN',
                        required: true,
                        pattern:'[0-9]{4,4}'
                    }                
                ]
            }
        ]
    }
    
});