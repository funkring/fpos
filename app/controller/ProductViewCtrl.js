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
        defaultCategoryButtonHeight: 58,
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
        this.lastCategoryId = null;
        this.selCategoryId = null;
        this.productPageCount = 0;
        this.categoryPageCount = 0;
        this.shown = false;
        this.autofav = false;
        this.calcedSizes = false;
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
        // wait until it is,
        // shown
        if ( this.shown ) {
            this.loadCategory(null);
        }
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
                self.lastCategoryId = null;
                self.selCategoryId = null;
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
        var category; 
        var self = this;
        var categoryId = button.categoryId || null;
        if ( categoryId === self.categoryId ) {
            if ( !categoryId ) {
                self.loadCategory(null);
            } else {
                // if category load parent
                category = self.allCategoryStore.getById(categoryId);
                if ( category ) {
                    self.loadCategory(category.get('parent_id'));
                }
            }
        } else {
            category = self.allCategoryStore.getById(categoryId);
            if ( category ) {
                var linkedId = category.get('link_id');
                if ( linkedId ) {
                    categoryId = linkedId;
                }
            }
            self.loadCategory(categoryId);
        }
    },
    
    calcSizes: function() {
        var self = this;
        if ( self.calcedSizes ) return;
        self.calcedSizes = true;
        
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
        self.productPageCount = gridX * gridY;
        
    },
      
    /**
     * set product item template
     */  
    productButtonInitialize: function(button) {     
        var self = this;   
        if ( !self.productButtonTmpl ) {
            self.calcSizes();
            
            var screenWidth = futil.screenWidth();
            var imageText = '';
            var productPrice = '<tpl if="price"><span class="ProductPrice">{[futil.formatFloat(values.price)]} {[Config.getCurrency()]}</span></tpl>'; 
             
            if ( self.allCategoryStore.getCount() > 0 || screenWidth >= 1024) {
                self.productButtonCls = 'ProductButton';
                
                if ( self.smallButton ) {
                    productPrice = '<tpl if="price"><span class="ProductPrice">{[futil.formatFloat(values.price)]}</span></tpl>';
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
                      '</tpl>'
                      );
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
                 '<tpl if="price"><span class="ProductPrice">{[futil.formatFloat(values.price)]} {[Config.getCurrency()]}</span></tpl>'                
                 );
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
                            if ( afterProduct == 'back' ) {
                                this.loadCategory(this.lastCategory);
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
    
       //build auto favourites   
       // if enabled
       if ( !self.autofav ) {
           self.autofav = true;
           var profile = Config.getProfile();
           if ( profile && profile.iface_autofav ) {
                self.calcSizes();
                self.productStore.buildAutoFavourites(self.productPageCount);
           }
       }
       // search
       self.productStore.searchProductsByCategory(categoryId, self.searchValue);
       
       // check scrolling
       var scroller = self.getProductDataView().getScrollable().getScroller();
       if ( !self.productPageCount || self.productStore.getCount() > self.productPageCount ) {
            if ( scroller.getDisabled() ) scroller.setDisabled(false);
       } else {
            if ( !scroller.getDisabled() ) scroller.setDisabled(true);
       }
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
       
        if ( !hidden ) {
            // check category scroller
            var scroller = self.getCategoryDataView().getScrollable().getScroller();
            if ( !self.categoryPageCount ) {
                self.categoryPageCount =  Math.floor(self.getCategoryDataView().element.getHeight() / self.getDefaultCategoryButtonHeight());
            }
            if ( !self.categoryPageCount || self.categoryStore.getCount() > self.categoryPageCount ) {
                if ( scroller.getDisabled() ) scroller.setDisabled(false);
            } else {
                if ( !scroller.getDisabled() ) scroller.setDisabled(true);
            }
        }
       
        // select category
        this.lastCategory = this.selCategoryId;
        this.selCategoryId = categoryId;
       
        // load products
        if( !hidden ) {
            self.loadProducts(categoryId);
        }     
    }    
    
});
    