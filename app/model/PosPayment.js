/*global Ext:false, Config:false*/
Ext.define('Fpos.model.PosPayment', {
   extend: 'Ext.data.Model',
   requires: [
       'Ext.proxy.PouchDB'
   ],
   config: {
       fields: ['order_id',
                'journal_id',
                'amount',
                'payment'],
       identifier: 'uuid',
       proxy: {
            type: 'pouchdb',
            database: 'fpos',
            resModel: 'fpos.order.payment'
       }
   }
});