/*global Ext:false, Config:false*/
Ext.define('Fpos.model.Place', {
   extend: 'Ext.data.Model',
   requires: [
       'Ext.proxy.PouchDB'
   ],
   config: {
       fields: ['name',                 
                'sequence',
                'top_id',
                'pos_color',
                'pos_unavail'
               ],
       identifier: 'uuid',
       proxy: {
            type: 'pouchdb',
            database: 'fpos',
            resModel: 'fpos.place'
       }
   }
});