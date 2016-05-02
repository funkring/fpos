/*global Ext:false, DBUtil:false, PouchDB:false, openerplib:false, futil:false, Fpos:false, Config:false, ViewManager:false */
Ext.define('Fpos.controller.TopViewCtrl', {
    extend: 'Ext.app.Controller',
    requires: [    
        'Ext.ux.Deferred',
        'Fpos.Config',
        'Ext.proxy.PouchDBUtil',
        'Fpos.view.TopView'
    ],
    config: {
        refs: {
            topDataView: '#topDataView',
            topView: '#topView'
        },
        control: {
            'button[action=selectTop]' : {
                tap: 'tapSelectTop'
            },   
            'button[action=selectPlace]' : {
                tap: 'tapSelectPlace',
                initialize: 'placeButtonInitialize'
            },
            placeView: {
                initialize: 'placeViewInitialize'
            }       
        }
    },
    
    init: function() {
        var self = this;
        this.topStore = Ext.StoreMgr.lookup("TopStore");        
        this.allTopStore = Ext.StoreMgr.lookup("AllTopStore");
        this.placeStore = Ext.StoreMgr.lookup("PlaceStore");
        this.topId = null;
        
    },
    
    placeViewInitialize: function() {
        var self = this;
        self.loadTop(null);
        
        // global event after sync
        Ext.Viewport.on({
            scope: self,
            reloadData: function() {
                //this.cache = {};
                self.placeButtonTmpl = null;
                self.loadTop(null);
            }
        });     
    },
    
    tapSelectTop: function(button) {
        var self = this;
        var topId = button.topId || null;
        if ( topId === self.topId ) {
            if ( !topId ) {
                self.loadTop(null);
            } else {
                // if top load parent
                var top = self.allTopStore.getById(topId);
                if ( top ) {
                    self.loadTop(top.get('parent_id'));
                }
            }
        } else {
            self.loadTop(topId);
        }
    },
      
    /**
     * set place item template
     */  
    placeButtonInitialize: function(button) {     
        var self = this;   
        if ( !self.placeButtonTmpl ) {
            self.placeButtonWidth = null;
            var screenWidth = futil.screenWidth();
            if ( self.allTopStore.getCount() > 0 || screenWidth >= 1024) {
                if ( screenWidth < 720 ) {       
                    self.placeButtonCls = 'PlaceButtonSmall';
                } else {
                    self.placeButtonCls = 'PlaceButton';
                }
                
                self.placeButtonTmpl = Ext.create('Ext.XTemplate',
                      '<tpl if="name.length &lt;= 7">',
                         '<div class="PlaceTextOnlyBig">',
                            '{name}',
                          '</div>',                  
                      '<tpl else>',
                         '<div class="PlaceTextOnly">',
                            '{name}',
                          '</div>',
                      '</tpl>');
            } else {     
                //set width 
                if ( screenWidth == 600 ) {
                    self.placeButtonWidth = "190px";
                } else if ( screenWidth == 320 ) {
                    self.placeButtonWidth = "186px";
                }
                
                self.placeButtonCls = 'PlaceButtonNoTop';  
                self.placeButtonTmpl = Ext.create('Ext.XTemplate',
                 '<div class="PlaceItemNoTop">',
                     '<div class="PlaceTextBigNoTop">',
                       '{name}',
                     '</div>',
                 '</div>');
            }
        }
        
        if ( self.placeButtonWidth ) {
            button.setWidth(self.placeButtonWidth);
        } 
        
        button.setCls(self.placeButtonCls);
        button.setTpl(self.placeButtonTmpl);
    },
    
    /**
     * select place
     */
    tapSelectPlace: function(button) {
        var place = button.getRecord();
        if ( place ) {
            Ext.Viewport.fireEvent("placeInput", place);            
        }
    },
    
    /**
     * load top
     */
    loadTop: function(topId) {
        var self = this;
        var db = Config.getDB();
        
        // get top
        var top = topId ? self.allTopStore.getById(topId) : null;
        if (top) {
            top.set('selected',true);
        }
        
        // load tops
        var tops = [];
        self.allTopStore.each(function(childTop) {
            if ( childTop.get('parent_id') == topId ) {       
                childTop.set('selected',false);
                childTop.set('parent',false);
                tops.push(childTop);
            } 
        });
           
        // get parents
        var parents = [];
        var parentId = null;
        if ( top ) {
            parentId = top.get('parent_id');
            var parent = self.allTopStore.getById(parentId);
            while (parent) {
                parents.push(parent);
                parent.set('parent',true);
                parent = self.allTopStore.getById(parent.get('parent_id'));
            }
        }
        
        // if has sub top
        if ( tops.length > 0 ) {
            if (top) {
                top.set('parent',true);
                parents.push(top);
            }
            self.topStore.setData(parents.concat(tops));            
        }
        else if ( top ) {
            // otherwise reset unselected siblings
            self.topStore.each(function(childTop) {
                if ( childTop.getId() != topId ) {
                    childTop.set('selected', false);
                }
            });
        }
        
        // hide or show tops
        var hidden = (self.topStore.getCount() === 0);
        if ( hidden != self.getTopDataView().getHidden() ) {
            self.getTopDataView().setHidden(hidden);
        }
       
        // load places
    }    
    
});
    