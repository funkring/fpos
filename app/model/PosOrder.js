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
                'date',
                'sv',
                'seq',
                'name',
                'ref',                
                'tax_ids',
                'payment_ids',
                'state',                
                'note',                
                'send_invoice',
                'amount_tax',
                'amount_total',
                'tag',
                'turnover',
                'cpos',
                'dep',
                'qr',
                'line_ids',
                'log_ids',
                'place_id',
                {name:'partner', foreignKey: 'partner_id', resModel: 'res.partner', persist:false}],
       identifier: 'uuid',
       proxy: {
            type: 'pouchdb',
            database: 'fpos',
            resModel: 'fpos.order'
       }
   }
});