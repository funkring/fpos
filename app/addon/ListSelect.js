/*global Ext:false, futil:false */

Ext.define('Ext.field.ListSelect', {
    extend: 'Ext.field.Select',
    xtype: 'listselect',
    requires: [
        'Ext.dataview.List',
        'Ext.field.Search',
        'Ext.util.DelayedTask'
    ],
    
    config: {
        /**
         * @cfg {Object} Navigation View
         */
        navigationView: null,
        
        /**
         * @cfg {String} current Search
         */
        searchValue: null,
        
        /**
         * @cfg {String} value field
         */
        valueField: "id",
        
        /**
         * @cfg {String} title
         */
        title: "Auswahl",
        
        /**
         * handler if creation of new 
         * records are allowed
         */
        pickerToolbarItems: null,
        
        /**
         * search delay
         */
        searchDelay: 500,
        
        /**
         * limit
         */
        limit: 100
        
    },
    
    showPicker: function() {
        var self = this;
        var navigationView = self.findNavigationView();
        var store = self.getStore();
        
        if ( navigationView !== null && store !== null) {
        
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
                },
                {
                    xtype: 'button',
                    iconCls: 'delete',
                    align: 'right',
                    listeners: {
                        release: function(button, e, opts) {
                            self.setValue(null);
                            navigationView.pop();
                        }
                    }
                }
           ];

           // add additional items
           var additionalToolbarItems=self.getPickerToolbarItems();
           if ( additionalToolbarItems ) {
                toolbarItems = toolbarItems.concat(additionalToolbarItems);
           }
        
           navigationView.push({
              title: self.getTitle(),
              newRecord: null,
              xtype : 'container',
              listeners: {
                  scope: self, 
                  show: self.firstSearch
              },
              items: [{
                docked: 'top',
                xtype: 'toolbar',                
                items: toolbarItems
              },
              {
                xtype: 'list',
                height: '100%',
                flex: 1, 
                store: store,
                itemTpl: '{' + self.getDisplayField() + '}',
                listeners: {
                    select: self.onListSelect,
                    //itemtap: self.onListTap,
                    scope: self
                }                  
              }],
              
              fieldSelectRecord: function(record) {
                  self.setValue(record);                  
              }
               
           });           
        } else {
            return self.callParent(arguments);
        }
   },
    
   initialize: function() {
        var self = this;        
        self.callParent(arguments);
        
        self.searchTask = Ext.create('Ext.util.DelayedTask', function() {
            self.search();
        });
   },
   
   searchDelayed: function(searchValue) {
       this.setSearchValue(searchValue);
       this.searchTask.delay(this.getSearchDelay());
   },
      
   search: function() {
       var self = this;
       var storeInst = self.getStore();
       var searchValue = self.getSearchValue();
       var searchField = self.getDisplayField();
       
       // search params
       var params = {
           limit: self.getLimit()
       };
       
       // options
       var options = {
           params : params
       };
       
       // build search domain
       if ( !Ext.isEmpty(searchValue) && searchValue.length >= 3) {       
           searchValue = searchValue.toLowerCase();
           var expr = "(doc."+searchField + " && " + "doc." + searchField + ".toLowerCase().indexOf(" + JSON.stringify(searchValue.substring(0,3)) +") >= 0)";
           params.domain = [[expr,'=',true]];
       }
       
       // search text or not
       if ( !Ext.isEmpty(searchValue) ) {
            options.filters = [{
                property: searchField,
                value: searchValue,
                anyMatch: true
            }];  
       }
       
       // load
       storeInst.load(options);
   },
   
   firstSearch: function() {
      this.search();  
   },
     
   findNavigationView: function() {
       var navigationView = this.getNavigationView();
       if (!navigationView) {
          navigationView = this.up('navigationview');
       }
       return navigationView;
   },
     
   onListSelect: function() {
       var self = this;
       self.callParent(arguments);
       
       var navigationView = self.findNavigationView();
       if ( navigationView !== null ) {
           navigationView.pop();
       }         
   },
   
   applyValue: function(value) {
        var record = value,
            index, store;
        var self = this;
        //we call this so that the options configruation gets intiailized, so that a store exists, and we can
        //find the correct value
        this.getOptions();
        store = this.getStore();
        if ((value !== undefined && value !== null && !value.isModel) && store) {
            if (typeof value === 'object') {
                value = value[this.getValueField()];
            }
        
            index = store.find(this.getValueField(), value, null, null, null, true);
            if ( index == -1 ) {
                var model = store.getModel();
                var proxy = model.getProxy();
                if ( proxy ) {
                    proxy.readDocument(value, function(err, record) {
                        if ( !err) {
                            self.setValue(record);
                        }
                    });
                }
                                
            }

            record = store.getAt(index);
        }

        return record;
    }
});