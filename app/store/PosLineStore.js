/*global Ext:false*/

Ext.define('Fpos.store.PosLineStore', {
    extend: 'Ext.data.Store',      
    config: {
        model: 'Fpos.model.PosLine',
        sorters: 'create_date'
    }
});
