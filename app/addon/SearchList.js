/*global Ext:false, futil:false, ViewManager:false */

Ext.define('Ext.field.SearchList', {
    extend: 'Ext.Container',
    xtype: 'search_list',
    
    requires: [
        'Ext.dataview.List',
        'Ext.field.Search',
        'Ext.util.DelayedTask',
        'Ext.form.ViewManager'
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
        searchEmpty: false,
        itemHandler: null,
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
        
        self.list = Ext.create('Ext.dataview.List',{
                height: '100%',
                flex: 1, 
                store: config.store,
                itemTpl: config.itemTpl,
                listeners: {                   
                    itemtap: function(list, index, target, record, event, opts) {
                        var itemHandler = self.getItemHandler();
                        if ( !itemHandler || itemHandler(self, list, index, target, record, event, opts) !== false ) {
                            self.editRecord(record);
                        }
                    }
                }    
        });
        
        config.items = [
            {
                 docked: 'top',
                 xtype: 'toolbar',                
                 items: toolbarItems
            },
            self.list
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
                // reset searchvalue 
                var model = this.getStore().getModel();
                
                var recordDefaults = {};
                var proxy = model.getProxy();
                if ( proxy ) {
                    recordDefaults = proxy.getRecordDefaults() || {}; 
                }
                
                record = Ext.create(model, recordDefaults);
                if (  !recordDefaults[displayField] ) {
                    record.set(displayField, this.getSearchValue());
                }
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
        ViewManager.stopLoading();    
        this.search();
        var searchField = this.down('searchfield');
        if ( searchField ) {
            searchField.setValue(this.getSearchValue());           
            searchField.focus();          
        }
    },
    
    searchDelayed: function(searchValue) {
        this.setSearchValue(searchValue);
        this.searchTask.delay(this.getSearchDelay());
    },
    
    search: function(searchOverride) {
        var self = this;
        var storeInst = self.getStore();
        var searchValue = self.getSearchValue();
        
        // search text or not
        var empty = Ext.isEmpty(searchValue);
        if ( !empty || self.getSearchEmpty() ) {
            // search params
            var params = {
                limit: self.getLimit()
            };
             
            // options
            var options = {
                params: params,
                callback: function() {
                    var records = self.list.getSelection();                    
                    if ( records.length > 0  ) {
                        var record = records[0];
                        self.list.scrollToRecord(record, false, false);
                    }
                }
            };
             
            // add filters
            if ( !empty ) {
                // add text filter                      
                options.filters = [{
                    property: self.getDisplayField(),
                    value: searchValue,
                    anyMatch: true
                }];
            }
                         
            // load
            storeInst.load(options);
        } else {
           storeInst.setData([]);
        }
   }
   
});