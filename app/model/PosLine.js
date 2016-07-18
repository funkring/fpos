/*global Ext:false, Config:false*/
Ext.define('Fpos.model.PosLine', {
   extend: 'Ext.data.Model',
   requires: [
       'Ext.proxy.PouchDB'
   ],
   config: {
       identifier: 'uuid',
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
                'p_dec',
                '_id',
                {name:'qty_prev', persist:false},
                {name:'qty_diff', persist:false},
                {name:'qty_op', persist:false}],
      idProperty: '_id'
   }
});