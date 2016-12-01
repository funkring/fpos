/*global Ext:false, futil:false */

Ext.define('Ext.field.SearchList', {
    extend: 'Ext.Container',
    xtype: 'search_list',
    requires: [
        'Ext.dataview.List',
        'Ext.field.Search',
        'Ext.util.DelayedTask'
    ],
    
    config: {
        formView: null,
        dataAdd: false,
        store: null,
        itemTpl: null,
        searchValue: null,
        displayField: 'name',
        searchDelay: 500,
        limit: 100,
        listeners: [
            {
                fn: 'onPainted',
                event: 'painted'
            }
        ]
    },
    
    constructor: function(config) {
        var self = this;
        
        var toolbarItems = [{
            xtype: 'searchfield',
            placeholder: 'Suche',
            flex: 1,
            listeners: {
                keyup: function(field, key, opts) {
                    self.searchDelayed(field.getValue());
                },
                clearicontap: function() {
                    self.searchDelayed(null);
                }
                
            }
        }];
        
        if ( config.dataAdd ) {
            toolbarItems.push({
                xtype: 'button',
                iconCls: 'add',
                align: 'right',
                listeners: {
                    tap: function(list, record) {
                        self.editRecord(null);       
                    }
                }      
            });
        }
        
        var displayField = config.displayField || self.config.displayField;
        if ( !config.itemTpl ) config.itemTpl = '{' + displayField + '}';
        
        if ( config.store && typeof config.store === 'string' ) {
            config.store = Ext.StoreMgr.lookup(config.store);
        } 
        
        config.items = [
            {
                 docked: 'top',
                 xtype: 'toolbar',                
                 items: toolbarItems
            },
            {
                xtype: 'list',
                height: '100%',
                flex: 1, 
                store: config.store,
                itemTpl: config.itemTpl,
                listeners: {
                    select: function(list, record) {
                       list.deselect([record], true);
                       self.editRecord(record);  
                    }
                }    
            }
        ];   
        
        self.searchTask = Ext.create('Ext.util.DelayedTask', function() {
            self.search();
        }); 
                
        self.callParent(arguments);        
    },
    
    findNavigationView: function() {
       return this.up('navigationview');
    },
    
    editRecord: function(record) {
        if ( this.getFormView() ) {
            var nav = this.findNavigationView();
            var displayField = this.getDisplayField();
            var title = record && record.get(displayField) || this.config.title || '';
            
            if ( !record ) {
                var model = this.getStore().getModel();
                
                var recordDefaults = {};
                var proxy = model.getProxy();
                if ( proxy ) {
                    recordDefaults = proxy.getRecordDefaults() || {}; 
                }
                
                if ( !recordDefaults[displayField] ) {
                    recordDefaults[displayField] = this.getSearchValue();
                }
                
                record = Ext.create(model, recordDefaults);
            }
            
            if (nav) {
                nav.push({
                    title: title,
                    xtype: this.getFormView(),
                    record: record
                });
            }
        }
    },
    
    onListSelect: function(list, record) {
        this.editRecord(record);
        if ( this.getFormView() ) {
            var nav = this.findNavigationView();
            if (nav) {
                nav.push({
                    title: record.get(this.getDisplayField()),
                    xtype: this.getFormView(),
                    record: record
                });
            }
        }
    },
    
    onPainted: function() {
      this.search();          
      
      var searchField = this.down('searchfield');
      if ( searchField ) {
          searchField.setValue("");
          searchField.focus();          
      }        
    },
    
    searchDelayed: function(searchValue) {
        this.setSearchValue(searchValue);
        this.searchTask.delay(this.getSearchDelay());
    },
    
    search: function() {
       var self = this;
       var storeInst = self.getStore();
       var searchValue = self.getSearchValue();
       
       // search text or not
       if ( !Ext.isEmpty(searchValue) ) {
            // search params
            var params = {
                limit: self.getLimit()
            };
            
            // options
            var options = {
                 params : params
            };
            
            options.filters = [{
                 property: self.getDisplayField(),
                 value: searchValue,
                 anyMatch: true
            }];  
            
            // load
            storeInst.load(options);
       } else {
          storeInst.setData([]);
       }
   }
   
});