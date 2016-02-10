/*global Ext:false, Config:false*/
Ext.define('Fpos.model.Category', {
   extend: 'Ext.data.Model',
   requires: [
       'Ext.proxy.PouchDB'
   ],
   config: {
       fields: ['name', 'parent_id'],
       identifier: 'uuid',
       proxy: {
            type: 'pouchdb',
            database: 'fpos',
            resModel: 'pos.category'
       }
   }
});