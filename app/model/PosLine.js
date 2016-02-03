/*global Ext:false, Config:false*/
Ext.define('Fpos.model.PosLine', {
   extend: 'Ext.data.Model',
   requires: [
       'Ext.proxy.PouchDB'
   ],
   config: {
       fields: ['order_id',
                'name',
                'product_id',
                'uom_id',
                'tax_ids',
                'price_brutto',
                'subtotal_incl',
                'discount',
                'notice'],
       identifier: 'uuid',
       proxy: {
            type: 'pouchdb',
            database: 'fpos',
            resModel: 'fpos.order.line'
       }
   }
});