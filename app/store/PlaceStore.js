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
        this.placeById = {};
        this.allPlaces = [];
        this.showAll = true;   
    },
    
    getPlaceById: function(placeId) {         
        return this.placeById[placeId];
    },
    
    buildIndex: function() {
        var self = this;
        this.resetIndex();
        self.each(function(place) {
             if ( !place.get('pos_unavail') ) {
                 // all products
                 self.allPlaces.push(place);
                 self.placeById[place.getId()]=place;
                 
                 // add by top
                 var top_id = place.get('top_id');
                 if ( top_id ) {
                     self.showAll = false;
                     var list = self.placeByTopId[top_id];
                     if ( !list ) {
                         list = [];
                         self.placeByTopId[top_id] = list;                     
                     }
                     list.push(place);
                 }
            }
        });
    },
    
    searchPlacesByTop: function(topId) {
        var places = null;
        if ( !topId ) { 
            places = this.showAll ? this.allPlaces : [];
        }  else {            
            places = this.placeByTopId[topId] || [];
        }
        this.setData(places);        
    }
});
