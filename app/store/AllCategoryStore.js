/*global Ext:false*/

Ext.define('Fpos.store.AllCategoryStore', {
    extend: 'Ext.data.Store', 
    requires: [
        'Ext.util.HashMap'
    ],      
    config: {
        model: 'Fpos.model.Category',
        sorters: 'sequence'
    },
    
    buildIndex: function() {
        var self = this;
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
