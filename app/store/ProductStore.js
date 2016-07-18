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
        this.productById = {};
        this.allProducts = [];   
        this.productQueue = [];  
        this.showAll = true;   
    },
    
    buildIndex: function() {
        var self = this;
        this.resetIndex();
        self.each(function(product) {
             if ( product.get('sale_ok') ) {
                 // all products
                 self.allProducts.push(product);
                 /*
                 if ( self.productQueue.length < 30) {
                     self.productQueue.push(product);
                 }*/
                 
                 // product by ean
                 self.productById[product.getId()] = product; 
                 var ean = product.get('ean13');
                 if ( ean ) {
                     self.productByEan[ean] = product;
                 }
                 
                 // add category
                 var categ_id = product.get('pos_categ_id');
                 if ( categ_id ) {
                     self.showAll = false; 
                     var list = self.productByCategoryId[categ_id];
                     if ( !list ) {
                         list = [];
                         self.productByCategoryId[categ_id] = list;                     
                     }
                     list.push(product);                 
                 }
            }
        });
    },
    
    getProductById: function(productId) {
        return this.productById[productId];
    },
    
    searchProductByEan: function(ean) {
        return this.productByEan[ean];
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
            if ( !categoryId ) {
                if ( this.showAll ) {
                    this.setData(products);
                } else {
                    this.setData(this.productQueue);
                }
            } else {
                this.setData(products);
            }
        }
    }
});
