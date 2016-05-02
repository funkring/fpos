/*global Ext:false*/

Ext.define('Fpos.store.PlaceStore', {
    extend: 'Ext.data.Store',      
    config: {
        model: 'Fpos.model.Place',
        sorters: 'sequence'
    },
    
    constructor: function(config) {
        this.resetIndex();    
        this.callParent(arguments);
    },
    
    resetIndex: function() {
        this.placeByTopId = {};
        this.allPlaces = [];   
    },
    
    buildIndex: function() {
        var self = this;
        this.resetIndex();
        self.each(function(place) {
             if ( !place.get('pos_unavail') ) {
                 // all products
                 self.allPlaces.push(place);
                 
                 // add by top
                 var top_id = place.get('top_id');
                 if ( top_id ) {
                     var list = self.placeByTopId[top_id];
                     if ( !list ) {
                         list = [];
                         self.placeByTopId[top_id] = list;                     
                     }
                     list.push(place);                 
                 }
            }
        });
    }
});
