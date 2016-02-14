/*global Ext:false, Config:false*/
Ext.define('Fpos.model.Category', {
   extend: 'Ext.data.Model',
   requires: [
       'Ext.proxy.PouchDB'
   ],
   config: {
       fields: ['name',                 
                'parent_id',
                'sequence',
                {name:'selected', persist:false},
                {name:'parent', persist:false}
               ],
       identifier: 'uuid',
       proxy: {
            type: 'pouchdb',
            database: 'fpos',
            resModel: 'pos.category'
       }
   }
});