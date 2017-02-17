/*global Ext:false*/

Ext.define('Fpos.view.AdminView', {
    extend: 'Ext.Panel',    
    xtype: 'fpos_admin',
    id: 'adminView',
    requires: [
      'Ext.Button'
    ],
    config: {        
        layout: 'hbox',
        items: [
             {
                xtype: 'panel',
                layout: 'vbox',
                cls: 'MenuBand',
                scrollable: 'vertical',
                items: [
                    {
                        xtype: 'button',
                        text: 'Datenbank zurücksetzen',    
                        action: 'adminResetDB',
                        ui: 'posInputButtonRed',
                        cls : 'MenuBandButton'        
                    },
                    {
                        xtype: 'button',
                        text: 'Karte aktivieren',    
                        action: 'activateCard',
                        ui: 'posInputButtonGreen',
                        cls : 'MenuBandButton'        
                    }
                ]                 
            }
        ]
    }    
});