/*global Ext:false, Config:false, ViewManager:false */

Ext.define('Fpos.view.PartnerListSelect', {
    extend: 'Ext.field.ListSelect',    
    xtype: 'fpos_partner_select',
    requires: [
        'Fpos.Config'
    ],
    config: {
        store: 'PartnerStore',
        displayField: 'name',
        displayTemplate: [
                    '<div>{name}</div>',
                    '<div><small>{[this.getAddress(values)]}</small></div>',
                    {
                        getAddress: function(values) {
                            var addr =  [];                            
                            if ( values.zip ) addr.push(values.zip);
                            if ( values.city ) addr.push(values.city);
                            if ( values.street ) addr.push(values.street);
                            if ( values.street2 ) addr.push(values.street2);                           
                            return addr.join(" - ");
                        }
                    }],               
        title: 'Kunde',
        autoSelect: false,
        pickerToolbarItems: [{
            xtype: 'button',
            iconCls: 'add',
            align: 'right',
            action: 'newPartner'      
        }]   
    },
    
    search: function() {
        var self = this;
        // check if partner search should be done
        // online        
        if ( Config.getOnlinePartner() ) {
            ViewManager.startLoading('Suche Online');
            
            var storeInst = self.getStore();
            var searchValue = self.getSearchValue();
            
            Config.getClient()['catch'](function(err) {
                ViewManager.stopLoading();
                self.searchOffline();            
            }).then(function(client) {
                var data = Config.getPartnerModel();
                data.domain = [];
                data.limit = self.getLimit();
                if ( !Ext.isEmpty(searchValue) ) {
                    data.domain.push(['name','ilike',searchValue]);
                }
                client.invoke("jdoc.jdoc", "jdoc_load", [data])['catch'](function(err) {
                    ViewManager.stopLoading();
                    self.searchOffline();
                }).then(function(res) {
                    ViewManager.stopLoading();
                    storeInst.setData(storeInst.getProxy().createRecords(res, true));
                });
            });
        } else {
            // otherwise search offline
            self.searchOffline();
        }
    },
    
    applyValue: function(value) {
        var self = this;
        if ( Config.getOnlinePartner() ) {
            if ( value && value.isModel && value.phantom ) {
                var db = Config.getDB();
                var doc = value.raw;
                if ( doc._id ) {
                    db.get(doc._id)['catch'](function(err) {
                        db.put(doc)['catch'](function(err) {
                            ViewManager.handleError(err, {name:'Fehler', error: 'Partner konnte nicht übernommen werden'});
                        });
                    });
                }
            }
        } 
        // call parent
        return self.callParent(arguments);        
    }
});