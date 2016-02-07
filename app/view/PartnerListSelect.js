/*global Ext:false*/

Ext.define('Fpos.view.PartnerListSelect', {
    extend: 'Ext.field.ListSelect',    
    xtype: 'fpos_partner_select',
    requires: [
     
    ],
    config: {
        store: 'PartnerStore',
        displayField: 'name',
        title: 'Kunde',
        pickerToolbarItems: [{
            xtype: 'button',
            iconCls: 'add',
            align: 'right',
            action: 'newPartner'      
        }]   
    }
});