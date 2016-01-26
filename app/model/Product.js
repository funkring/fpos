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
                'uom',
                'uom_code',
                'code',
                'ean13',                                
                'image',
                'has_image',
                'pos_categ_id',
                'income_pdt',
                'expense_pdt',
                'to_weight',
                'tax_name',
                'tax_amount',
                'tax_incl',
                'tax_uuid',
                'price',
                'brutto_price'],
       identifier: 'uuid',
       proxy: {
            type: 'pouchdb',
            database: 'fpos',
            resModel: 'product.product'
       }
   }
});