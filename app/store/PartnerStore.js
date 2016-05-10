/*global Ext:false*/

Ext.define('Fpos.store.PartnerStore', {
    extend: 'Ext.data.Store',      
    config: {
        model: 'Fpos.model.Partner',
        sorters: 'name',
        grouper: function(record) { 
            return record.get('name')[0];
        }
    }
});
