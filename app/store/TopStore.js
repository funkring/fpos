/*global Ext:false*/

Ext.define('Fpos.store.TopStore', {
    extend: 'Ext.data.Store',      
    config: {
        model: 'Fpos.model.Top',
        proxy: {
            type: 'memory'
        }
    }
});
