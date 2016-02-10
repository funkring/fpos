/*global Ext:false, DBUtil:false, PouchDB:false, openerplib:false, futil:false, Fpos:false, Config:false, ViewManager:false */
Ext.define('Fpos.controller.ProductViewCtrl', {
    extend: 'Ext.app.Controller',
    requires: [    
        'Ext.ux.Deferred',
        'Fpos.Config',
        'Ext.proxy.PouchDBUtil',
        'Fpos.view.ProductView',
        'Ext.util.DelayedTask'
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
    
    init: function() {
        var self = this;
        this.productStore = Ext.StoreMgr.lookup("ProductStore");
        this.categoryStore = Ext.StoreMgr.lookup("CategoryStore");
        this.allCategoryStore = Ext.StoreMgr.lookup("AllCategoryStore");
        this.unitStore = Ext.StoreMgr.lookup("ProductUnitStore");
        
        //search task
        self.searchTask = Ext.create('Ext.util.DelayedTask', function() {
            self.loadProducts(self.categoryId, self.searchValue);
        });        
        
    },
    
    productViewInitialize: function() {
        var self = this;
        self.loadCategory(null);
        
        // global event after sync
        Ext.Viewport.on({
            scope: self,
            reloadData: function() {
                self.loadCategory(null);
            }
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
                  '<tpl if="image_small">',
                      '<div class="ProductImage">',
                        '<img src="data:image/jpeg;base64,{image_small}"/>',                                        
                      '</div>',
                      '<div class="ProductText">',
                        '{name}',
                      '</div>',
                      '<span class="ProductPrice">{[futil.formatFloat(values.brutto_price)]} {[Config.getCurrency()]} / {[this.getUnit(values.uom_id)]}</span>',
                  '<tpl elseif="name.length &lt;= 7">',
                     '<div class="ProductTextOnlyBig">',
                        '{name}',
                      '</div>',
                      '<span class="ProductPrice">{[futil.formatFloat(values.brutto_price)]} {[Config.getCurrency()]} / {[this.getUnit(values.uom_id)]}</span>',                  
                  '<tpl else>',
                     '<div class="ProductTextOnly">',
                        '{name}',
                      '</div>',
                      '<span class="ProductPrice">{[futil.formatFloat(values.brutto_price)]} {[Config.getCurrency()]} / {[this.getUnit(values.uom_id)]}</span>',
                  '</tpl>',{
                      getUnit: function(uom_id) {
                        var uom = self.unitStore.getById(uom_id);
                        return uom && uom.get('name') || '';
                      }
                      
                  });
        }
        button.setTpl(self.productButtonTmpl);
    },
    
    /**
     * select product
     */
    tapSelectProduct: function(button) {
        var product = button.getRecord();
        if ( product ) {
            // send productInput EVENT
            Ext.Viewport.fireEvent("productInput", product);            
        }
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

        // options
        var options = {
        };

        // category        
        if ( self.categoryId ) {
            options.params = {
                domain : [['pos_categ_id','=',categoryId]]
            };
        } 

                
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
        self.productStore.load(options);               
    },
    
    /**
     * load category
     */
    loadCategory: function(categoryId) {
        var self = this;
        var db = Config.getDB();
        
        // get category
        var category = categoryId ? self.allCategoryStore.getById(categoryId) : null;
        
        // get parents
        var parents = [];
        var parent = category;
        while ( parent ) {
            parents.push(parent);
            parent = self.allCategoryStore.getById(parent.get('parent_id'));                    
        }
        
        var buttons = [self.getCategoryButton1(), self.getCategoryButton2(), self.getCategoryButton3()];
        var i;
        
        //show/hide buttons     
        parents = parents.reverse();
        for ( i=0; i < buttons.length; i++) {
            if ( i < parents.length ) {
                buttons[i].categoryId = parents[i].getId();
                if ( buttons[i].isHidden() ) {
                    buttons[i].setHidden(false);
                }                                
                buttons[i].setText(parents[i].get('name'));
            } else {     
                if ( !buttons[i].isHidden() ) {                  
                    buttons[i].setHidden(true);
                }
            }
        } 
        
        // load categories
        var categories = [];
        self.allCategoryStore.each(function(category) {
            if ( category.get('parent_id') == categoryId ) {
                categories.push(category);
            } 
        });
        
        self.categoryStore.setData(categories);
        self.getCategoryDataView().setHidden(categories.length === 0);
        self.loadProducts(categoryId);     
        
    }    
    
});
    