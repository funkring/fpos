/*global Ext:false, DBUtil:false, PouchDB:false, openerplib:false, futil:false, Fpos:false, Config:false, ViewManager:false */
Ext.define('Fpos.controller.PartnerCtrl', {
    extend: 'Ext.app.Controller',
    requires: [    
        'Fpos.view.PartnerListSelect',
        'Fpos.view.PartnerView'
    ],
    config: {
        refs: {
            mainView: '#mainView'
        },
        control: {
            'button[action=newPartner]': {
                tap: 'onNewPartner'
            }                  
        }
    },
    
    onNewPartner: function() {
        var newPartner = Ext.create('Fpos.model.Partner', {});
        this.editPartner(newPartner);
    },
    
    editPartner: function(record) {
        var self = this;  
        
        if ( futil.isDoubleTap() )
            return;
        
        self.getMainView().push({
            title: 'Partner',
            xtype: 'fpos_partner_form',
            record: record,
            deleteable: true
        });        
    }
    
});