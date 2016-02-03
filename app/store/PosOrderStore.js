/*global Ext:false*/

Ext.define('Fpos.store.PosOrderStore', {
    extend: 'Ext.data.Store',      
    config: {
        model: 'Fpos.model.PosOrder',
        sorters: 'date'
    }
});
