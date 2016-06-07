/*global Ext:false*/

Ext.define('Ext.util.Summary', {

    constructor: function (cfg) {
        var self = this;
        self.initConfig(cfg);
        self.names = [];
        self.map = {};
        return self;
    },
    
    initialize: function() {
        this.callParent(arguments);
        var scroller = this.getScrollable().getScroller();
        scroller.on('refresh', this.scrollToBottom, this);
    },
    
    scrollToBottom: function() {
        var scroller = this.getScrollable().getScroller();
        scroller.scrollToEnd(false);
    }
});