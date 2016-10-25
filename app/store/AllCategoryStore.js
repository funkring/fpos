/*global Ext:false, Config:false*/

Ext.define('Fpos.store.AllCategoryStore', {
    extend: 'Ext.data.Store', 
    requires: [
        'Ext.util.HashMap',
        'Fpos.Config'
    ],      
    config: {
        model: 'Fpos.model.Category',
        sorters: 'sequence'
    },
    
    buildIndex: function() {
        var self = this;

        // build map        
        self.categoryMap = Ext.create('Ext.util.HashMap');
        self.each(function(category) {
           var parent_id = category.get('parent_id') || '';
           if ( !category.get('pos_unavail') ) {
               var childCategories = self.categoryMap.get(parent_id);
               if ( childCategories === undefined ) {
                   childCategories = [];
                   self.categoryMap.add(parent_id, childCategories);
               }
               childCategories.push(category);
           }
        });
        
        // check fold        
        var profile = Config.getProfile();
        self.fold = false;
        if (  profile && profile.iface_fold ) {    
            self.fold = true;       
            self.foldMap = Ext.create('Ext.util.HashMap');
            
            // get root categories
            var mainCategories = self.categoryMap.get('');
            var newCategoryMap = Ext.create('Ext.util.HashMap');
            // iterate childs
            var childIterator = function(childCategory, parentCategory) {           
                var newParent = childCategory;
                if ( parentCategory && childCategory.get('foldable') ) {
                    self.foldMap.replace(childCategory.getId(), parentCategory.getId());                  
                    newParent = parentCategory;
                } else {
                   var parent_id = childCategory.get('parent_id') || '';
                   var childCategories = newCategoryMap.get(parent_id);
                   if ( childCategories === undefined ) {
                       childCategories = [];
                       newCategoryMap.add(parent_id, childCategories);
                   }
                   childCategories.push(childCategory);
                }
                
                // handle next childs
                Ext.each(self.getChilds(childCategory.getId()), function(nextChildCategory) {
                    childIterator(nextChildCategory, newParent);
                });
                             
            };
            
            // iterate main categories            
            Ext.each(mainCategories, function(mainCategory) {
                childIterator(mainCategory);
            });
            
            // replace map
            self.categoryMap = newCategoryMap;
        }
    },
    
    getMappedId: function(categoryId) {
        if ( this.fold )  {
            return this.foldMap.get(categoryId) || categoryId;
        }  
        return categoryId;
    },
    
    getChilds: function(categoryId) {
        if ( !this.categoryMap ) return [];
        var parent_id = categoryId || '';
        return this.categoryMap.get(parent_id) || [];
    },
    
    eachChild: function(categoryId, callback) {
        var self = this;
        if ( !self.categoryMap ) return;
        var childCategories = self.getChilds(categoryId);
        if ( childCategories ) {
            Ext.each(childCategories, function(child) {
               self.eachChild(child.getId(), callback);
               callback(child);
            });
        }
    }
});
