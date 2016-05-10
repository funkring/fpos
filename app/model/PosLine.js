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
                'price',
                'netto',
                'qty',
                'tara',
                'subtotal_incl',
                'subtotal',
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