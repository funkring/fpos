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
        defaultButtonWidth: 100,
        refs: {
            topDataView: '#topDataView',
            topView: '#topView',
            placeDataView: '#placeDataView'
        },
        control: {
            'button[action=selectTop]' : {
                release: 'tapSelectTop'
            },   
            'button[action=selectPlace]' : {
                tap: 'tapSelectPlace',
                initialize: 'placeButtonInitialize'
            },
            topView: {
                initialize: 'topViewInitialize',
                show: 'onTopViewShow'
            }       
        }
    },
    
    init: function() {
        var self = this;
        this.buttonWidth = self.getDefaultButtonWidth().toString()+"px";
        this.buttonHeight = self.getDefaultButtonWidth().toString()+"px";
        this.topStore = Ext.StoreMgr.lookup("TopStore");        
        this.allTopStore = Ext.StoreMgr.lookup("AllTopStore");
        this.placeStore = Ext.StoreMgr.lookup("PlaceStore");
        this.topId = null;
        this.shown = false;
        
        if ( Config.isMobilePos() ) {
            this.setDefaultButtonWidth(66);
        }
        
    },
    
    topViewInitialize: function() {
        var self = this;

        // global event after sync
        Ext.Viewport.on({
            scope: self,
            reloadData: function() {
                self.shown = false;
                self.placeButtonTmpl = null;
            }
        });     
    },
    
    onTopViewShow: function() {
        if ( !this.shown ) {
            this.shown = true;
            this.loadTop(null);
        }
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
            var viewWidth = self.getPlaceDataView().element.getWidth()-6;
            var viewHeight = self.getPlaceDataView().element.getHeight()-6;
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
                preferredX = Math.round(viewWidth / gridX)-4;
            }
            if ( gridY < 2) {
                if ( viewHeight > preferredY ) {
                    preferredY = viewHeight;
                }
            } else {
                preferredY = Math.round(viewHeight / gridY)-4;
            }
            self.buttonWidth = preferredX.toString() + "px";
            self.buttonHeight = preferredY.toString() + "px";
            
            var screenWidth = futil.screenWidth();
            if ( self.allTopStore.getCount() > 0 || screenWidth >= 1024) {
                self.placeButtonCls = 'PlaceButton';
                self.placeButtonTmpl = Ext.create('Ext.XTemplate',
                      '<tpl if="name.length &lt;= 7">',
                         '<div class="PlaceTextOnlyBig">',
                            '{name}',
                          '</div>',                  
                      '<tpl else>',
                         '<div class="PlaceTextOnly">',
                            '{name}',
                          '</div>',
                      '</tpl>',
                      '<tpl if="amount">',
                        '<span class="PlaceAmount">{[futil.formatFloat(values.amount)]} {[Config.getCurrency()]}</span>',
                        '<tpl if="user">',
                            '<span class="PlaceUser">{user}</span>',
                        '</tpl>',                                                
                      '</tpl>'
                      );
            } else {     
                self.placeButtonCls = 'PlaceButtonNoTop';  
                self.placeButtonTmpl = Ext.create('Ext.XTemplate',
                 '<div class="PlaceItemNoTop">',
                     '<div class="PlaceTextBigNoTop">',
                       '{name}',
                     '</div>',
                 '</div>',
                 '<tpl if="amount">',
                    '<span class="PlaceAmount">{[futil.formatFloat(values.amount)]} {[Config.getCurrency()]}</span>',
                    '<tpl if="user">',
                        '<span class="PlaceUser">{user}</span>',
                    '</tpl>',                                                
                 '</tpl>');
            }
        }
        
        button.setWidth(self.buttonWidth);
        button.setHeight(self.buttonHeight);
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
        self.placeStore.searchPlacesByTop(topId);
    }    
    
});
    