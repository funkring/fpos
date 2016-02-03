/*global Ext:false, Config:false*/
Ext.define('Fpos.model.ProductUnit', {
   extend: 'Ext.data.Model',
   requires: [
       'Ext.proxy.PouchDB'
   ],
   config: {
       fields: ['name'],
       identifier: 'uuid',
       proxy: {
            type: 'pouchdb',
            database: 'fpos',
            resModel: 'product.uom'
       }
   }
});