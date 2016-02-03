/*global Ext:false, Config:false*/
Ext.define('Fpos.model.PosOrder', {
   extend: 'Ext.data.Model',
   requires: [
       'Ext.proxy.PouchDB'
   ],
   config: {
       fields: ['fpos_user_id',
                'user_id',                
                'partner_id',                
                'number',
                'date',
                'tax_ids',
                'payment_ids',
                'state',
                'note',
                'origin',
                'send_invoice',
                'amount_tax',
                'amount_total'],
       identifier: 'uuid',
       proxy: {
            type: 'pouchdb',
            database: 'fpos',
            resModel: 'fpos.order'
       }
   }
});