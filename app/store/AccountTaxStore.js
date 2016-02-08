/*global Ext:false*/

Ext.define('Fpos.store.AccountTaxStore', {
    extend: 'Ext.data.Store',      
    config: {
        model: 'Fpos.model.AccountTax',
        sorters: 'name'
    }
});
