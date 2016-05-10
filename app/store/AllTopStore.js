/*global Ext:false*/

Ext.define('Fpos.store.AllTopStore', {
    extend: 'Ext.data.Store',      
    config: {
        model: 'Fpos.model.Top',
        sorters: 'sequence',
        params: {
            domain: [('pos_unavail','=',false)]
        }
    }
});
