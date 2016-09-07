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
                'pos_main',
                'pos_color',
                'pos_unavail',
                'after_product',
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