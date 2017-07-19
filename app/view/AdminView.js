/*global Ext:false*/

Ext.define('Fpos.view.AdminView', {
    extend: 'Ext.Panel',    
    xtype: 'fpos_admin',
    id: 'adminView',
    requires: [
      'Ext.SingleTouchButton'
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
                        xtype: 'sbutton',
                        text: 'Datenbank optimieren',    
                        action: 'optimizeDB',
                        ui: 'posInputButtonBlack',
                        cls : 'MenuBandButton'      
                    },
                    {
                        xtype: 'sbutton',
                        text: 'Datenbank zurücksetzen',    
                        action: 'adminResetDB',
                        ui: 'posInputButtonRed',
                        cls : 'MenuBandButton'        
                    },
                    {
                        xtype: 'sbutton',
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