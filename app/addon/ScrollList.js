/*global Ext:false*/

Ext.define('Ext.view.ScrollList', {
    extend: 'Ext.List',
    xtype: 'scrolllist',

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