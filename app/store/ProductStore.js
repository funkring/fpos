/*global Ext:false*/

Ext.define('Fpos.store.ProductStore', {
    extend: 'Ext.data.Store',      
    config: {
        model: 'Fpos.model.Product',
        sorters: [
         {
            property: 'sequence',
            direction: 'ASC'
         },
         {
            property: 'name',
            direction: 'ASC'
         }
        ] 
    },
    
    constructor: function(config) {
        this.resetIndex();    
        this.callParent(arguments);
    },
    
    resetIndex: function() {
        this.productByCategoryId = {};
        this.productByEan = {};
        this.allProducts = [];   
        this.productQueue = [];     
    },
    
    buildIndex: function() {
        var self = this;
        this.resetIndex();
        self.each(function(product) {
             // all products
             self.allProducts.push(product);
             if ( self.productQueue.length < 30) {
                 self.productQueue.push(product);
             } 
             
             // product by ean
             var ean = product.get('ean13');
             if ( ean ) {
                 self.productByEan[ean] = product;
             }
             
             // add category
             var categ_id = product.get('pos_categ_id');
             if ( categ_id ) {
                 var list = self.productByCategoryId[categ_id];
                 if ( !list ) {
                     list = [];
                     self.productByCategoryId[categ_id] = list;                     
                 }
                 list.push(product);                 
             }
        });
    },
    
    searchProductsByCategory: function(categoryId, textSearch) {
        var products;
        if ( !categoryId ) { 
            products = this.allProducts;
        }  else {            
            products = this.productByCategoryId[categoryId] || [];
        }
        if ( !Ext.isEmpty(textSearch) ) {
            var filtered = [];
            textSearch = textSearch.toLowerCase();
            Ext.each(products, function(product) {
                if ( product.get('name').toLowerCase().indexOf(textSearch) >= 0 ) {
                   filtered.push(product); 
                }
            });
            this.setData(filtered);
        } else {
            if ( !categoryId) {
                this.setData(this.productQueue);
            } else {
                this.setData(products);
            }
        }
    }
});
