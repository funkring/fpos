/*global Ext:false*/

Ext.define('Fpos.store.ProductStore', {
    extend: 'Ext.data.Store',
    requires: [      
        'Ext.util.HashMap'
    ],
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
        this.categoryStore = Ext.StoreMgr.lookup("AllCategoryStore");
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
            var categId = this.categoryStore.getMappedId(product.get('pos_categ_id'));
            this.addToCategory(categId, product);
            
            // add category 2
            var categOtherId = product.get('pos_categ2_id');
            if ( categOtherId ) {
                var categOtherMappedId = this.categoryStore.getMappedId(categOtherId);
                if ( categOtherMappedId != categOtherId ) {
                    if ( categOtherMappedId ) {
                        var categ = this.categoryStore.getById(categId);
                        var categOther = this.categoryStore.getById(categOtherMappedId);
                        if ( categOther && categ ) {
                            var categParentId = categ.get('parent_id');
                            var categOtherParentId = categOther.get('parent_id');
                            
                            // check if parentid of category is the same as other parent id 
                            // ... or mapped id is not the parent of categ parentId
                            // ... and mapped is not equal to the same category                            
                            if ( categParentId != categOtherParentId && categOtherMappedId != categParentId && categOtherMappedId != categId) {
                                this.addToCategory(categOtherMappedId, product);
                            }
                        }
                    }
                } else {
                    this.addToCategory(categOtherId, product);
                }
            }
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
    
    compareProduct: function(a_id, b_id) {
      if ( !a_id && b_id ) return -1;
      if ( a_id && !b_id ) return 1;
      if ( a_id == b_id ) return 0;
      var product_a = this.getProductById(a_id);
      var product_b = this.getProductById(b_id);
      if ( !product_a && product_b ) return -1;
      if ( product_a && !product_b ) return 1;
      if ( !product_a && !product_b) return 0;
      return (product_a.get('sequence') || 0) - (product_b.get('sequence') || 0);
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
    },
    
    getRateSorted: function(categoryId, limit, ignore) {
        var self = this;
        var rateSortedProducts = [];        
        
        var ignoreMap = null;
        if ( ignore) {
            ignoreMap = Ext.create('Ext.util.HashMap');
            Ext.each(ignore, function(product) {
                ignoreMap.replace(product.getId(), true);
            });
        }
        
        this.categoryStore.eachChild(categoryId, function(category) {
            var products = self.productByCategoryId[category.getId()];
            if (products) {
                Ext.each(products, function(product) {
                   // only normal products
                   if ( product.get("pos_sec") ) return;

                   // check ignore map
                   if ( ignoreMap && ignoreMap.get(product.getId()) ) return;
                   
                   // check if full, or to less rated
                   var rate = product.get('pos_rate');
                   if ( rateSortedProducts.length >= limit && rateSortedProducts[rateSortedProducts.length-1].get('pos_rate') > rate ) return;
                   
                   // insert sorted
                   var insertNext = null;
                   for (var i=0; i<rateSortedProducts.length; i++) {
                       if ( insertNext ) {
                           var curProduct = rateSortedProducts[i];
                           rateSortedProducts[i] = insertNext;
                           insertNext = curProduct;
                       } else if ( rate > rateSortedProducts[i].get('pos_rate') ) {
                           insertNext = rateSortedProducts[i];
                           rateSortedProducts[i] = product;
                       } else if ( rateSortedProducts[i].getId() == product.getId() ) {
                           return;
                       }
                   } 
                   
                   // insert last if there is place
                   if ( rateSortedProducts.length < limit ) {
                       if ( !insertNext ) {
                            rateSortedProducts.push(product);
                       } else {
                            rateSortedProducts.push(insertNext);      
                       }
                    }
                });
            }
        });
        
        return rateSortedProducts;
    },
    
    buildAutoFavourites: function(limit) {
        var self = this;
        if ( self.builtAutoFavLimit && self.builtAutoFavLimit < limit ) return;
        self.builtAutoFavLimit = limit;

        // auto root favourites        
        var space = limit - self.productQueue.length;
        if ( space > 0) {
            Ext.each(self.getRateSorted(null, space, self.productQueue), function(product) {
                self.productQueue.push(product);
            });
        } 
        
        // calc child favourites
        this.categoryStore.eachChild(null, function(category) {
            var products = self.productByCategoryId[category.getId()];
            var space = limit;
            if ( products ) {
                space = limit - products.length;
            } 
            if ( space > 0 ) {
                Ext.each(self.getRateSorted(category.getId(), space, products), function(product) {
                    self.addToCategory(category.getId(), product);
                });
            }
        });
        
    }
});
