/*global Ext:false*/

Ext.define('Fpos.store.ProductStore', {
    extend: 'Ext.data.Store',      
    config: {
        model: 'Fpos.model.Product',
        sorters: 'name'
    }
});
