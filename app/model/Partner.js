/*global Ext:false*/
Ext.define('Fpos.model.Partner', {
   extend: 'Ext.data.Model',
   requires: [
       'Ext.proxy.PouchDB'
   ],
   config: {
       fields: ['name', 
                'email',
                'mobile',
                'phone',
                'street',
                'street2',
                'zip', 
                'city',
                'fax',
                'customer',
                'comment',
                'vat'
                ],        
       identifier: 'uuid',
       proxy: {           
            type: 'pouchdb',
            database: 'fpos',
            domain: [['customer','=',true]],
            resModel: 'res.partner'
       },
       deleteChecks: [
       {
          field : 'partner_id',
          message: 'Ein verwendeter Partner kann nicht gelöscht werden!'
       }]
   } 
});