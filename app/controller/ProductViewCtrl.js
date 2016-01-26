/*global Ext:false, DBUtil:false, PouchDB:false, openerplib:false, futil:false, Fpos:false, Config:false, ViewManager:false */
Ext.define('Fpos.controller.ProductViewCtrl', {
    extend: 'Ext.app.Controller',
    requires: [    
        'Ext.ux.Deferred',
        'Fpos.Config',
        'Ext.proxy.PouchDBUtil',
        'Fpos.view.ProductView'
    ],
    config: {
        refs: {
            categoryButton1: '#categoryButton1',
            categoryButton2: '#categoryButton2',
            categoryButton3: '#categoryButton3',
            productSearch: '#productSearch',
            categoryDataView: '#categoryDataView',
            productView: '#productView'
        },
        control: {
            'button[action=selectCategory]' : {
                tap: 'tapSelectCategory'
            },   
            'button[action=selectProduct]' : {
                tap: 'tapSelectProduct',
                initialize: 'productButtonInitialize'
            },
            productSearch: {    
                keyup : 'searchItemKeyUp',
                clearicontap: 'searchItemClearIconTap'                
            },
            productView: {
                initialize: 'productViewInitialize'
            }       
        }
    },
    
            
    productViewInitialize: function() {
        var self = this;
        self.loadCategory(null);
        
        //search task
        self.searchTask = Ext.create('Ext.util.DelayedTask', function() {
            self.loadProducts(self.categoryId, self.searchValue);
        });        
    },
    
    tapSelectCategory: function(button) {
        var self = this;
        self.loadCategory(button.categoryId || null);
    },
      
    /**
     * set product item template
     */  
    productButtonInitialize: function(button) {
        var self = this;
        if ( !self.productButtonTmpl ) {
            self.productButtonTmpl = Ext.create('Ext.XTemplate',
                  '<div class="ProductImage">',
                    '<img src="data:image/jpeg;base64,{image}"/>',                                        
                  '</div>',
                  '<div class="ProductText">',
                    '{name}',
                  '</div>',
                  '<span class="ProductPrice">{[futil.formatFloat(values.brutto_price)]} {[Config.getCurrency()]} / {uom}</span>');
        }
        button.setTpl(self.productButtonTmpl);
    },
    
    /**
     * select product
     */
    tapSelectProduct: function(button) {
        //debugger;
    },
    
    /**
     * search
     */        
    searchItemKeyUp: function(field, key, opts) {
        this.searchValue = field.getValue();
        this.searchTask.delay(Config.getSearchDelay());    
    },
    
    /**
     * clear search
     */
    searchItemClearIconTap: function() {
        this.loadProducts(this.categoryId);
    },
    
    /**
     * load product
     */
    loadProducts: function(categoryId, search) {
        var self = this;
        self.categoryId = categoryId;

        // domain
        var options = {
            params : {
                domain : [['pos_categ_id','=',categoryId]]
            }        
        };
                
        // search text or not
        if ( !search ) {
            self.searchValue = null;
            self.searchTask.cancel();
            self.getProductSearch().reset();
        } else {
            options.filters = [{
                property: 'name',
                value: search,
                anyMatch: true
            }];         
        }
        
        // load
        var db = Config.getDB();
        var store = Ext.StoreMgr.lookup("ProductStore");
        store.load(options);               
    },
    
    /**
     * load category
     */
    loadCategory: function(categoryId) {
        var self = this;
        var db = Config.getDB();
        var store = Ext.StoreMgr.lookup("CategoryStore");
        // filter
        var options = {
            params : {
                domain : [['parent_id','=',categoryId]],
            },
            callback: function() {
                 DBUtil.findParents(db, categoryId, function(err, parents) {
                    // vars
                    var buttons = [self.getCategoryButton1(), self.getCategoryButton2(), self.getCategoryButton3()];
                    var i;
                    
                    //show buttons     
                    parents = !err && parents && parents.reverse() || [];
                    for ( i=0; i < buttons.length; i++) {
                        if ( i < parents.length ) {
                            buttons[i].categoryId = parents[i]._id;
                            buttons[i].setHidden(false);                                
                            buttons[i].setText(parents[i].name);
                        } else {
                            buttons[i].setHidden(true);
                        }
                    }
                    
                    // enable/disable category view
                    self.getCategoryDataView().setHidden(store.getCount() === 0); 
                    // load products
                    self.loadProducts(categoryId);                    
                });
            
            }                    
        };
        
        // load
        store.load(options);
    }    
    
});
    