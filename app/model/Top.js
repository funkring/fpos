/*global Ext:false, Config:false*/
Ext.define('Fpos.model.Top', {
   extend: 'Ext.data.Model',
   requires: [
       'Ext.proxy.PouchDB'
   ],
   config: {
       fields: ['name',                 
                'sequence',
                'parent_id',
                'pos_color',
                'pos_unavail'
               ],
       identifier: 'uuid',
       proxy: {
            type: 'pouchdb',
            database: 'fpos',
            resModel: 'fpos.top'
       }
   }
});