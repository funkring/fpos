/*global Ext:false*/
Ext.define('Fpos.store.OrderSelectionStore', {
    extend: 'Ext.data.Store',      
    config: {
        model: 'Fpos.model.OrderSelection',
        sorters: 'date_order' /*,
        grouper: {
            property: 'journal',
            direction:'ASC'
        }*/
    }
});
