/*global Ext:false*, Fclipboard:false, futil*/

Ext.define('Ext.TapLabel', {
    extend: 'Ext.Label',
    xtype: 'taplabel',
    config: {
        handler: null,
        scope: null
    },
    
    
    initialize: function() {
        var self = this;
        self.callParent();

        this.element.on({
            scope      : self,
            tap        : 'onTap',
            touchend   : 'onRelease'
        });
    },
    
    // @private
    onTap: function(e) {
        if ( !futil.isDoubleTap() ) {
            this.fireAction('tap', [this, e], 'doTap');
        }
    },
    
    doTap: function(me, e) {
        var handler = me.getHandler(),
            scope = me.getScope() || me;

        if (!handler) {
            return;
        }

        if (typeof handler == 'string') {
            handler = scope[handler];
        }

        //this is done so if you hide the button in the handler, the tap event will not fire on the new element
        //where the button was.
        e.preventDefault();
        handler.apply(scope, arguments);
    },
    
    // @private
    onRelease: function(e) {
        this.fireAction('release', [this, e]);
    }    
    
});