/*global Ext:false*/

Ext.define('Fpos.store.AllCategoryStore', {
    extend: 'Ext.data.Store',      
    config: {
        model: 'Fpos.model.Category',
        sorters: 'sequence'
    }
});
