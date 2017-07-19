/*global Ext:false, DBUtil:false, PouchDB:false, openerplib:false, futil:false, Fpos:false, Config:false*/
Ext.define('Fpos.view.Main', {
    extend: 'Ext.navigation.View',
    xtype: 'main',   
    id: 'mainView', 
    requires: [
      'Ext.SingleTouchButton'  
    ],
    config: {
        defaultBackButtonText: 'Zurück',
        layout: {
            type: 'card',
            animation: false            
        },
        navigationBar: {            
            items: [
                {
                    xtype: 'sbutton',
                    id: 'loginButton',
                    text: 'Anmelden',                                  
                    align: 'left',
                    action: 'switchUser',
                    hidden: true                
                },
                {
                    xtype: 'sbutton',
                    id: 'userButton1',
                    user: null,
                    text: 'User 1',                                  
                    align: 'left',
                    action: 'fastSwitchUser',
                    hidden: true                
                },            
                {
                    xtype: 'sbutton',
                    id: 'userButton2',
                    user: null,
                    text: 'User 2',                                  
                    align: 'left',
                    action: 'fastSwitchUser',
                    hidden: true                
                },
                {
                    xtype: 'sbutton',
                    id: 'userButton3',
                    user: null,
                    text: 'User 3',                                  
                    align: 'left',
                    action: 'fastSwitchUser',
                    hidden: true                
                },
                {
                    xtype: 'sbutton',
                    id: 'userButton4',
                    user: null,
                    text: 'User 4',                                  
                    align: 'left',
                    action: 'fastSwitchUser',
                    hidden: true                
                },
                {
                    xtype: 'sbutton',
                    id: 'userButton5',
                    user: null,
                    text: 'User 5',                                  
                    align: 'left',
                    action: 'fastSwitchUser',
                    hidden: true                
                },
                {
                    xtype: 'sbutton',
                    id: 'userButton6',
                    user: null,
                    text: 'User 6',                                  
                    align: 'left',
                    action: 'fastSwitchUser',
                    hidden: true                
                },
                {
                    xtype: 'sbutton',
                    id: 'userButton7',
                    user: null,
                    text: 'User 7',                                  
                    align: 'left',
                    action: 'fastSwitchUser',
                    hidden: true                
                },
                {
                    xtype: 'sbutton',
                    id: 'userButton8',
                    user: null,
                    text: 'User 8',                                  
                    align: 'left',
                    action: 'fastSwitchUser',
                    hidden: true                
                },
                {
                    xtype: 'sbutton',
                    id: 'userButton9',
                    user: null,
                    text: 'User 9',                                  
                    align: 'left',
                    action: 'fastSwitchUser',
                    hidden: true                
                },
                {
                    xtype: 'sbutton',
                    id: 'placeButton',
                    text: 'Plätze',
                    align: 'left',
                    action: 'switchPlace',
                    ui: 'back',
                    hidden: true                    
                },
                {
                    xtype: 'sbutton',
                    text: 'Bonieren',
                    id: 'saveOrderButtonMobile', 
                    //ui: 'action',
                    ui: 'posInputButtonGreenBevel',    
                    align: 'left',
                    action: 'saveOrder',
                    hidden: true 
                },
                {
                    xtype: 'sbutton',
                    iconCls: 'list',
                    id: 'mainMenuButton',
                    ui: 'plain',
                    align: 'right',
                    hidden: true
                },
                {
                    xtype: 'sbutton',
                    id: 'printOrderButton',
                    text: 'Drucken',   
                    //ui: 'action',
                    align: 'right',
                    action: 'printOrder',
                    hidden: true                
                },   
                {
                    xtype: 'sbutton',
                    id: 'saveOrderButton',
                    text: 'Bonieren',   
                    //ui: 'action',
                    ui: 'posInputButtonGreenBevel',    
                    align: 'right',
                    action: 'saveOrder',
                    hidden: true                
                },   
                {
                    xtype: 'sbutton',
                    id: 'deleteRecordButton',
                    iconCls: 'trash',
                    align: 'right',
                    action: 'deleteRecord',  
                    hidden: true
                },                 
                {
                    xtype: 'sbutton',
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
