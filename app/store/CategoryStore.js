/*global Ext:false*/

Ext.define('Fpos.store.CategoryStore', {
    extend: 'Ext.data.Store',      
    config: {
        model: 'Fpos.model.Category',
        sorters: 'name'
    }
});
