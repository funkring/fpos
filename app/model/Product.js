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
                'code',
                'ean13',                                
                'image_small',
                'pos_categ_id',
                'income_pdt',
                'expense_pdt',
                'to_weight',
                'taxes_id',
                'price',                
                'brutto_price',
                'sequence',
                'pos_name'],
       identifier: 'uuid',
       proxy: {
            type: 'pouchdb',
            database: 'fpos',
            resModel: 'product.product'
       }
   }
});