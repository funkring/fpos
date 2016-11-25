/*global Ext:false, Config:false, openerplib:false */

Ext.define('Fpos.core.Printer', {
    requires: ['Fpos.store.CategoryStore',
               'Fpos.store.ProductStore',
               'Ext.ux.Deferred'],
    
    config : {
        profile: null,
        timeout: 5000,
        retryTimeout: 1000,
        queueSize: 50     
    },
    
    constructor: function(config) {
        this.initConfig(config);
        this.productStore = Ext.StoreMgr.lookup("ProductStore");
        this.queue = [];
        this.active = false;
    },
    
    updateProfile: function(profile, oldProfile) {
        var self = this;
        self.hasCategories = false;
        self.categories = {};
        if ( profile ) {            
            if ( profile.pos_category_ids && profile.pos_category_ids.length > 0) {
                self.categoryStore = Ext.StoreMgr.lookup("AllCategoryStore");
                Ext.each(profile.pos_category_ids, function(categoryId) {
                    // enable category
                    self.categories[categoryId] = true;
                    // enable also child categories
                    self.categoryStore.eachChild(categoryId, function(childCategory) {
                        self.categories[childCategory.getId()] = true;
                    });
                    // one category found
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
                if ( !pos_categ_id ) return false;
                
                // get mapped
                if ( this.categoryStore ) {
                    pos_categ_id = this.categoryStore.getMappedId(pos_categ_id);
                }
                
                // check
                if ( !this.categories[pos_categ_id] ) return false;
            } 
            return true;
        } 
        return false;
    },
    
    isAvailable: function() {
        return !this.getProfile().local || Config.hasPrinter();
    },
       
    /**
     * @private
     */ 
    remotePrint: function(html, callback) {
        openerplib.json_rpc(this.getProfile().name, "printHtml", [html], callback, { timeout: this.getTimeout() });
    },
    
    /**
     * @private
     */
    printQueue: function(callback) {
        var self = this;
        if ( self.queue.length > 0 && !self.active) {
            self.active = true;
            var html = self.queue[0];
            self.remotePrint(html, function(err) {
                self.active = false;
                if (err) {
                    // queue next print
                    setTimeout(function() {
                        self.printQueue(); 
                    }, self.getRetryTimeout() );
                    
                    // notify error
                    if (callback) {
                        var message = err.message || err.name || 'unbekannte Ursache';
                        callback({name: "Übermittlungsfehler", message: message});
                    }
                    
                } else {
                    // remove current 
                    self.queue.shift();
                    // print next
                    self.printQueue();
                    
                    // notify callback
                    if (callback) callback();
                }
            });
        } else {
            // notify callback
            if (callback) callback();
        }
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
            // check queue
            if ( self.queue.length < self.getQueueSize() ) {
                // queue print
                self.queue.push(html);
                self.printQueue(function(err) {
                    if ( err ) {
                        // reject error                                          
                        deferred.reject(err);
                    } else {
                        // finished
                        deferred.resolve();
                    }
                });
            } else {
                // reject error
                deferred.reject({name: 'queue_full', message: 'Druck Warteschlange ist voll!'});
            }
        }
        return deferred.promise();
    }
});
