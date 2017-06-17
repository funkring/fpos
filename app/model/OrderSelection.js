/*global Ext:false */
Ext.define('Fpos.model.OrderSelection', {
   extend: 'Ext.data.Model',
   config: {
       fields: ['name',
                'date_order',
                'amount_total',
                'pos_reference',
                'id',
                'journal']       
   }
});