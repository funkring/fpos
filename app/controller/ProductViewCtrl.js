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
        defaultButtonWidth: 100,
        refs: {
            productSearch: '#productSearch',
            categoryDataView: '#categoryDataView',
            productView: '#productView',
            productDataView: '#productDataView',
            categoryToolbar: '#categoryToolbar'
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
        this.buttonWidth = self.getDefaultButtonWidth().toString()+"px";
        this.buttonHeight = self.getDefaultButtonWidth().toString()+"px";
        this.productStore = Ext.StoreMgr.lookup("ProductStore");
        this.categoryStore = Ext.StoreMgr.lookup("CategoryStore");
        this.allCategoryStore = Ext.StoreMgr.lookup("AllCategoryStore");
        this.unitStore = Ext.StoreMgr.lookup("ProductUnitStore");
        this.shown = false;
        //this.cache = {};
        
        //search task
        self.searchTask = Ext.create('Ext.util.DelayedTask', function() {
            self.loadProducts(self.categoryId, self.searchValue);
        });   
        
        // check size
        if ( Config.isMobilePos() ) {
            self.smallButton = true;
            self.setDefaultButtonWidth(73);
        } else if ( Config.isTabletPos() ) {
            self.smallButton = true;
            self.setDefaultButtonWidth(87);
        }
        
        // listen on place input, for reseting category
        Ext.Viewport.on({
            scope: self,
            placeInput: self.onPlaceInput
        });           
    },
    
    onPlaceInput: function() {
        this.loadCategory(null);
    },
    
    productViewInitialize: function() {
        var self = this;
        
        // add listener
        self.getProductDataView().addListener({
            'painted' : {
                fn: self.onProductViewPainted,
                scope: self,
                order: 'before'
            }        
        });
        
        // global event after sync
        Ext.Viewport.on({
            scope: self,
            reloadData: function() {
                self.shown = false;
                self.productButtonTmpl = null;
                self.loadCategory(null);
            }
        });     
    },
    
    onProductViewPainted: function() {
        // prepare first initialisation
        if ( !this.shown ) {
            this.shown = true;
            // hide search
            var profile = Config.getProfile();
            if ( profile && profile.iface_nosearch )  {
                this.getCategoryToolbar().setHidden(true);
            }
                        
            // load root
            this.loadCategory(null);
        }
    },
    
    tapSelectCategory: function(button) {
        var self = this;
        var categoryId = button.categoryId || null;
        if ( categoryId === self.categoryId ) {
            if ( !categoryId ) {
                self.loadCategory(null);
            } else {
                // if category load parent
                var category = self.allCategoryStore.getById(categoryId);
                if ( category ) {
                    self.loadCategory(category.get('parent_id'));
                }
            }
        } else {
            self.loadCategory(categoryId);
        }
    },
      
    /**
     * set product item template
     */  
    productButtonInitialize: function(button) {     
        var self = this;   
        if ( !self.productButtonTmpl ) {    
            var viewWidth = self.getProductDataView().element.getWidth()-6;
            var viewHeight = self.getProductDataView().element.getHeight()-6;
            var defaultWidth = self.getDefaultButtonWidth();
            var defaultWidthAndMargin = defaultWidth+2;          
            var gridX = Math.floor(viewWidth / defaultWidthAndMargin);
            var gridY = Math.floor(viewHeight / defaultWidthAndMargin);
            var preferredX = defaultWidth;
            var preferredY = defaultWidth;

            if ( gridX < 2 ) {
                if ( viewWidth > preferredX ) {
                    preferredX = viewWidth;
                }
            } else {
                preferredX = Math.round(viewWidth / gridX)-3;
            }
            if ( gridY < 2) {
                if ( viewHeight > preferredY ) {
                    preferredY = viewHeight;
                }
            } else {
                preferredY = Math.round(viewHeight / gridY)-3;
            }
            self.buttonWidth = preferredX.toString() + "px";
            self.buttonHeight = preferredY.toString() + "px";
            
            var screenWidth = futil.screenWidth();
            var imageText = '';
            var productPrice = '<span class="ProductPrice">{[futil.formatFloat(values.price)]} / {[this.getUnit(values.uom_id)]}</span>'; 
             
            if ( self.allCategoryStore.getCount() > 0 || screenWidth >= 1024) {
                self.productButtonCls = 'ProductButton';
                
                if ( self.smallButton ) {
                    productPrice = '<span class="ProductPrice">{[futil.formatFloat(values.price)]}</span>';
                } else {
                    imageText = '<div class="ProductText">{pos_name}</div>';
                }      
                           
                self.productButtonTmpl = Ext.create('Ext.XTemplate',
                      '<tpl if="image_small">',
                          '<div class="ProductImage">',
                            '<img src="data:image/jpeg;base64,{image_small}"/>',                                        
                          '</div>',
                          imageText,
                          productPrice,
                      '<tpl elseif="pos_name.length &lt;= 7">',
                         '<div class="ProductTextOnlyBig">',
                            '{pos_name}',
                          '</div>',
                          productPrice,                  
                      '<tpl else>',
                         '<div class="ProductTextOnly">',
                            '{pos_name}',
                          '</div>',
                          productPrice,
                      '</tpl>',{
                          getUnit: function(uom_id) {
                            var uom = self.unitStore.getById(uom_id);
                            return uom && uom.get('name') || '';
                          }
                      });
            } else {     
                self.productButtonCls = 'ProductButtonNoCat';  
                if ( !self.smallButton ) {
                    imageText = '<div class="ProductTextNoCat">{pos_name}</div>';
                }  
                self.productButtonTmpl = Ext.create('Ext.XTemplate',
                 '<div class="ProductItemNoCat">',
                     '<tpl if="image_small">',
                         '<div class="ProductImageNoCat">',
                            '<img src="data:image/jpeg;base64,{image_small}"/>',                                        
                         '</div>',
                         imageText,
                     '<tpl else>',
                         '<div class="ProductTextBigNoCat">',
                           '{pos_name}',
                         '</div>',
                     '</tpl>',
                 '</div>', 
                 '<span class="ProductPrice">{[futil.formatFloat(values.price)]} {[Config.getCurrency()]} / {[this.getUnit(values.uom_id)]}</span>',                  
                 {
                      getUnit: function(uom_id) {
                        var uom = self.unitStore.getById(uom_id);
                        return uom && uom.get('name') || '';
                      }
                 });
            }
        }
        
        button.setWidth(self.buttonWidth);
        button.setHeight(self.buttonHeight);
        button.setCls(self.productButtonCls);
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
            
            // category action
            // after product input
            if ( this.categoryId ) {
                var category = this.allCategoryStore.getById(this.categoryId);
                if ( category ) {
                
                    var afterProduct = category.get('after_product');                    
                    if ( afterProduct ) {
                    
                        if ( afterProduct == 'root') {
                            // load root
                            this.loadCategory(null);
                        } else {
                            var parent_id = category.get('parent_id');
                            if  ( afterProduct == 'parent' ) {
                                // load parent                           
                                this.loadCategory(parent_id);
                            } else if ( afterProduct == 'main' ) {
                                // search next main category
                                var main_id = null;
                                while ( parent_id && !main_id) {
                                    var parent = this.allCategoryStore.getById(parent_id);
                                    if ( parent ) {
                                        if ( parent.get('pos_main') ) {
                                            main_id = parent.getId();                                        
                                        }        
                                        parent_id = parent.get('parent_id');
                                    } else {
                                        parent_id = null;
                                    }                                
                                }                            
                                // load main
                                this.loadCategory(main_id);
                            } 
                        }
                        
                    }
                    
                }
            }     
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
        this.searchValue = null;
        this.searchTask.delay(Config.getSearchDelay());  
    },
      
    /**
     * load product
     */
    loadProducts: function(categoryId) {
       var self = this;      
       
       self.categoryId = categoryId;
       
       // stop search if running
       if ( Ext.isEmpty(self.searchValue) ) {
            self.searchTask.cancel();
            if ( self.getProductSearch().getValue() ) {
                self.getProductSearch().reset();
            }
       }
       
       // search
       self.productStore.searchProductsByCategory(categoryId, self.searchValue);
       
        /*
       // search params
       var params = {
           limit: Config.getSearchLimit()
       };
       
       // options
       var options = {
           params : params
       };
       
        // category        
        if ( self.categoryId ) {
            options.params = {
                domain : [['pos_categ_id','=',categoryId]]
            };
        } 

        // build search domain        
        if ( Ext.isEmpty(self.searchValue) ) {
            self.searchTask.cancel();
            if ( self.getProductSearch().getValue() ) {
                self.getProductSearch().reset();
            }
            
            // query cache
            var key = self.categoryId || 0;
            var cached = self.cache[key];
            if ( cached === undefined ) {
                //set cache
                cached = [];
                self.cache[key] = cached;
                
                // cache
                options.callback = function() {
                    self.productStore.each(function(rec) {
                        cached.push(rec); 
                    });
                };
            } else {
                // set cached
                self.productStore.setData(cached);
                return;
            }
            
        } else {
            // build search token
            if ( self.searchValue.length >= 3 ) {            
               var searchStr = JSON.stringify(self.searchValue.substring(0,3).toLowerCase());
               var expr = "(doc.name && doc.name.toLowerCase().indexOf(" + searchStr +") >= 0)";
               params.domain = [[expr,'=',true]];           
            }
            // add search filter
            options.filters = [{
                property: 'name',
                value: self.searchValue,
                anyMatch: true
            }];
        }
      
        // load
        self.productStore.load(options);     */          
    },
    
    /**
     * load category
     */
    loadCategory: function(categoryId) {
        var self = this;
        var db = Config.getDB();
        
        // get category
        var category = categoryId ? self.allCategoryStore.getById(categoryId) : null;
        if (category) {
            category.set('selected',true);
        }
        
        // load categories
        var categories = self.allCategoryStore.getChilds(categoryId);
        Ext.each(categories, function(childCategory) {
            childCategory.set('selected',false);
            childCategory.set('parent',false);
        });
           
        // get parents
        var parents = [];
        var parentId = null;
        if ( category ) {
            parentId = category.get('parent_id');
            var parent = self.allCategoryStore.getById(parentId);
            while (parent) {
                parents.push(parent);
                parent.set('parent',true);
                parent = self.allCategoryStore.getById(parent.get('parent_id'));
            }
        }
        
        // if has sub categories
        if ( categories.length > 0 ) {
            if (category) {
                category.set('parent',true);
                parents.push(category);
            }
            self.categoryStore.setData(parents.concat(categories));            
        }
        else if ( category ) {
            // otherwise reset unselected siblings
            self.categoryStore.each(function(childCategory) {
                if ( childCategory.getId() != categoryId ) {
                    childCategory.set('selected', false);
                }
            });
        }
        
        // hide or show categories
        var hidden = (self.categoryStore.getCount() === 0);
        if ( hidden != self.getCategoryDataView().getHidden() ) {
            self.getCategoryDataView().setHidden(hidden);
        }
       
        // load products
        if( !hidden ) {
            self.loadProducts(categoryId);
        }     
    }    
    
});
    