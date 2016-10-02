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
    
    addToCategory: function(categ_id, product) {
        if ( categ_id ) {
             this.showAll = false; 
             var list = this.productByCategoryId[categ_id];
             if ( !list ) {
                 list = [];
                 this.productByCategoryId[categ_id] = list;                     
             }
             list.push(product);     
        }
    },
    
    addProduct: function(product) {
        if ( product.get('sale_ok') ) {
            // all products
            this.allProducts.push(product);
            
            // add to favorite
            if ( product.get('pos_fav') ) {
                this.productQueue.push(product);
            }
            
            // product by ean
            this.productById[product.getId()] = product; 
            var ean = product.get('ean13');
            if ( ean ) {
                this.productByEan[ean] = product;
            }
            
            // add category
            this.addToCategory(product.get('pos_categ_id'), product);
            this.addToCategory(product.get('pos_categ2_id'), product);
        }
    },
    
    readProduct: function(uuid, callback) { 
        var self = this;
        self.getProxy().readDocument(uuid, function(err, product) {
            // add product if not added
            if ( product && !self.productById[uuid] ) {
                self.addProduct(product);
            }
            if ( callback ) callback(err, product);
        });  
    },
    
    buildIndex: function() {
        var self = this;
        this.resetIndex();
        self.each(function(product) {
            self.addProduct(product);
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
