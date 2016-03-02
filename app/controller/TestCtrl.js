/*global Ext:false, DBUtil:false, PouchDB:false, openerplib:false, futil:false, Fpos:false, Config:false, ViewManager:false */
Ext.define('Fpos.controller.TestCtrl', {
    extend: 'Ext.app.Controller',
    requires: [    
        'Ext.ux.Deferred',
        'Fpos.view.TestView'
    ],
    config: {
        refs: {
            testLabel: '#testLabel',
            testView: '#testView'
        },
        control: {     
            'button[action=testInterface]' : {
                tap: 'testInterface'
            },  
            'button[action=testPrint]' : {
                tap: 'testPrint'
            },
            'button[action=testDisplay]' : {
                tap: 'testDisplay'
            },
            'button[action=testCashdrawer]' : {
                tap: 'testCashdrawer'  
            },
            'button[action=testInfo]' : {
                tap: 'testInfo'
            },
            'button[action=delDB]' : { 
                tap: 'delDB'
            }
        }
    },
    
    // TESTS
    beforeTest: function() {
        this.getTestLabel().setHtml('');
    },
    
    testInterface: function() {
        var self = this;
        self.beforeTest();
        var valid = window.PosHw.test(function(res) {
            self.getTestLabel().setHtml(res);
        }, 
        function(err) {
            self.getTestLabel().setHtml(err);
        });
    },
    
    testPrint : function() {        
        var self = this;
        self.beforeTest();
        var html = "<br>Hier ein paar Zeilen" +
                   "<br>um zu testen ob der Druck" +
                   "<br>funktioniert"+
                   "<br><br><br><br><br><br>";
        var valid = window.PosHw.printHtml(html, function(res) {
            self.getTestLabel().setHtml(res || '');
        }, 
        function(err) {
            self.getTestLabel().setHtml(err);
        });  
    },
    
    testDisplay : function() {
        var self = this;
        self.beforeTest();
        var valid = window.PosHw.display("23",function(res) {
            self.getTestLabel().setHtml("OK!");
        }, 
        function(err) {
            self.getTestLabel().setHtml(err);
        });  
    },
    
    testCashdrawer : function() {
        var self = this;
        self.beforeTest();
        var valid = window.PosHw.openCashDrawer(function() {
            self.getTestLabel().setHtml("OK!");
        }, 
        function(err) {
            self.getTestLabel().setHtml(err);
        });  
    },
    
    testInfo : function() {
        var self = this;
        self.beforeTest();
        var db = Config.getDB();
        db.info().then(function(info) {            
           self.getTestLabel().setHtml(            
            "<pre>" +
            "Screen Resolution: " + futil.screenWidth().toString() + "x" + futil.screenHeight().toString() + "\n" +
            JSON.stringify(info, null, 2) +
            "</pre>"
            );
        });
    },
    
    delDB: function() {
        var self = this;
        self.beforeTest();
        Ext.Msg.confirm('Komplett Löschung','Wollen sie wirklich alle Daten löschen?', function(buttonId) {
            if ( buttonId == 'yes' && !Config.getUser() ) {          
                var db = Config.getDB();
                db.destroy().then(function() {
                    window.location.reload();
                })['catch'](function(err) {
                    self.getTestLabel().setHtml(err);
                });
            }
        });
    }
    
});