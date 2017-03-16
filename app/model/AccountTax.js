/*global Ext:false, Config:false*/
Ext.define('Fpos.model.AccountTax', {
   extend: 'Ext.data.Model',
   requires: [
       'Ext.proxy.PouchDB'
   ],
   config: {
       fields: ['name',
                'amount',
                'type',
                'price_include',
                'sequence',
                'st'],
       identifier: 'uuid',
       proxy: {
            type: 'pouchdb',
            database: 'fpos',
            resModel: 'account.tax'
       }
   }
});