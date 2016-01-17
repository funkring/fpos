/*global Ext:false, DBUtil:false, PouchDB:false, openerplib:false, futil:false, Fpos:false, Config:false, ViewManager:false */
Ext.define('Fpos.controller.TestCtrl', {
    extend: 'Ext.app.Controller',
    requires: [    
        'Ext.ux.Deferred',
        'Fpos.view.TestView'
    ],
    config: {
        refs: {
            testLabel: '#testLabel'
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
            }
        }
    },
    
    // TESTS
    beforeTest: function() {
        self.getTestLabel().setHtml('');
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
        var html = "<br/><br/>Hello World<br/><br/>";
        var valid = window.PosHw.printHtml(html, function(res) {
            self.getTestLabel().setHtml("OK!");
        }, 
        function(err) {
            self.getTestLabel().setHtml(err);
        });  
    },
    
    testDisplay : function() {
        var self = this;
        self.beforeTest();
        var valid = window.PosHw.setDisplay("23",function(res) {
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
    }
    
});