/*global Ext:false*/

Ext.define('Fpos.view.TopView', {
    extend: 'Ext.Panel',    
    xtype: 'fpos_top',
    id: 'topView',
    requires: [
        'Ext.DataView',
        'Fpos.view.TopItem',
        'Fpos.view.PlaceItem'
    ],
    config: {
        layout: 'vbox',
        cls: 'TopContainer',
        items: [        
            {
                layout: "hbox",
                flex: 1,
                items: [                   
                    {        
                        xtype: 'dataview',
                        cls: 'TopSelection',
                        useComponents: true,
                        id: 'topDataView',                              
                        defaultType: 'fpos_top_item',
                        hidden: true,
                        store: 'TopStore'
                    },
                    {
                        cls: 'PlaceDataView',
                        xtype: 'dataview',
                        useComponents: true,
                        scrollable: 'vertical',
                        defaultType: 'fpos_place_item',
                        flex: 1,    
                        store: "PlaceStore"        
                    }                 
                ]
            }
        ]
    }
    
});