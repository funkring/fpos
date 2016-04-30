/*global Ext:false, Config:false*/
Ext.define('Fpos.model.PosLine', {
   extend: 'Ext.data.Model',
   requires: [
       'Ext.proxy.PouchDB'
   ],
   config: {
       fields: ['name',
                'product_id',
                'uom_id',
                'tax_ids',
                'brutto_price',
                'qty',
                'tara',
                'subtotal_incl',
                'discount',
                'notice',
                'sequence',
                'tag',
                'flags',
                'a_pre',
                'a_dec',
                'p_pre',
                'p_dec']
   }
});