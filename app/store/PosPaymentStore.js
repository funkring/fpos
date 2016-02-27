/*global Ext:false*/

Ext.define('Fpos.store.PosPaymentStore', {
    extend: 'Ext.data.Store',      
    config: {
        model: 'Fpos.model.PosPayment'
    }
});
