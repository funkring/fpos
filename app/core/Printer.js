/*global Ext:false, Config:false, openerplib:false */

Ext.define('Fpos.core.Printer', {
    requires: ['Fpos.store.CategoryStore',
               'Fpos.store.ProductStore',
               'Ext.ux.Deferred'],
    
    config : {
        profile: null
    },
    
    constructor: function(config) {
        this.initConfig(config);
        this.productStore = Ext.StoreMgr.lookup("ProductStore");
    },
    
    updateProfile: function(profile, oldProfile) {
        var self = this;
        self.hasCategories = false;
        self.categories = {};
        if ( profile ) {
            if ( profile.pos_category_ids && profile.pos_category_ids.length > 0) {
                Ext.each(profile.pos_category_ids, function(categoryId) {
                    self.categories[categoryId] = true;  
                    self.hasCategories = true;
                });
            }
        }
    },
    
    isProductAllowed: function(productId) {
        var product = this.productStore.getProductById(productId);
        if ( product ) {
            if ( this.hasCategories ) {
                var pos_categ_id = product.get('pos_categ_id');
                if ( !pos_categ_id || !this.categories[pos_categ_id] ) {
                    return false;
                }          
            } 
            return true;
        } 
        return false;
    },
    
    isAvailable: function() {
        return !this.getProfile().local || Config.hasPrinter();
    },
    
    printHtml: function(html) {
        var self = this;
        var deferred = Ext.create('Ext.ux.Deferred');
        if ( self.getProfile().local ) {
            setTimeout(function() {
               Config.printHtml(html);
               deferred.resolve();
            },0);        
        } else {
            openerplib.json_rpc(self.getProfile().name, "printHtml", [html], function(err) {
                if (err) {
                    deferred.reject(err);
                } else {
                    deferred.resolve();
                }
            });
        }
        return deferred.promise();
    }
});
