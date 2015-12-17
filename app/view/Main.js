/*global Ext:false, DBUtil:false, PouchDB:false, openerplib:false, futil:false, Fpos:false, Config:false*/
Ext.define('Fpos.view.Main', {
    extend: 'Ext.navigation.View',
    xtype: 'main',   
    id: 'mainView', 
    requires: [
        
    ],
    config: {
        navigationBar: {
            items: [   
                {
                    xtype: 'button',
                    iconCls: 'list',
                    id: 'mainMenuButton',
                    ui: 'plain',
                    align: 'left',
                    hidden: true
                },
                {
                    xtype: 'button',
                    id: 'deleteRecordButton',
                    iconCls: 'trash',
                    align: 'right',
                    action: 'deleteRecord',  
                    hidden: true
                }, 
                {
                    xtype: 'button',
                    id: 'saveRecordButton',
                    text: 'Speichern',                                  
                    align: 'right',
                    action: 'saveRecord',
                    hidden: true                
                }                    
            ]
        }
    }
});
