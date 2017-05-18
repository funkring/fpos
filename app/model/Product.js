/*global Ext:false, Config:false*/
Ext.define('Fpos.model.Product', {
   extend: 'Ext.data.Model',
   requires: [
       'Ext.proxy.PouchDB'
   ],
   config: {
       fields: ['name',
                'description',
                'description_sale',
                'uom_id',
                'nounit',
                'code',
                'ean13',                                
                'image_small',
                'pos_categ_id',
                'income_pdt',
                'expense_pdt',
                'to_weight',
                'taxes_id',
                'netto',                
                'price',   
                'sequence',
                'pos_name',
                'pos_color',
                'available_in_pos',
                'active',
                'sale_ok',
                'pos_nogroup',
                'pos_minus',
                'pos_price_pre',
                'pos_price_dec',
                'pos_amount_pre',
                'pos_amount_dec',
                'pos_price',
                'pos_report',
                'pos_categ2_id',
                'pos_fav',
                'pos_sec',
                'pos_cm',
                'pos_rate',
                'pos_action'
                ],
       identifier: 'uuid',
       proxy: {
            type: 'pouchdb',
            database: 'fpos',
            resModel: 'product.product'
       }
   }
});