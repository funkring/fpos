/*global Ext:false*/

Ext.define('Fpos.store.OPartnerStore', {
    extend: 'Ext.data.Store',      
    config: {
        model: 'Fpos.model.OPartner',
        sorters: 'name',
        grouper: function(record) { 
            return record.get('name')[0];
        }
    }
});
