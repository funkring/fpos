/*global Ext:false, Config:false*/
Ext.define('Fpos.model.Place', {
   extend: 'Ext.data.Model',
   requires: [
       'Ext.proxy.PouchDB'
   ],
   config: {
       fields: ['name',                 
                'sequence',
                'complete_name',
                'top_id',
                'pos_color',
                'pos_unavail',
                {name:'amount', persist:false}
               ],
       identifier: 'uuid',
       proxy: {
            type: 'pouchdb',
            database: 'fpos',
            resModel: 'fpos.place'
       }
   }
});