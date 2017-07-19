/*global Ext:false, futil:false, ViewManager:false */

Ext.define('Ext.SingleTouchButton', {
    extend: 'Ext.Button',
    xtype: 'sbutton',
    
    // @private
    onTap: function(e) {
        if ( !futil.isDoubleTap() ) {
            this.callParent(arguments);
        }     
    }    
});