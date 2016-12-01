/*global Ext:false */
Ext.define('Fpos.model.OPartner', {
   extend: 'Ext.data.Model',
   requires: [
        'Ext.data.proxy.Odoo'
   ],
   config: {
       fields: [
        'name', 
        'email',
        'mobile',
        'phone',
        'street',
        'street2',
        'zip', 
        'city',
        'fax',
        'customer',
        'comment'
       ],
       proxy: {
            type: 'odoo',
            resModel: 'res.partner',
            recordDefaults: {
                customer: true
            }
       }
   } 
});