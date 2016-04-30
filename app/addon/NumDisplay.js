/*global Ext:false*, Fclipboard:false, futil*/

Ext.define('Ext.view.NumDisplay', {
    extend: 'Ext.Component',
    xtype: 'numdisplay',
    config: {
        cls: 'NumDisplay',
        value: null,
        clsValue: 'NumDisplay',
        info: null,        
        clsInfo: 'NumDisplayInfo',
        error: null,
        clsError: 'NumDisplayError',
        handler: null,
        scope: null
    },
    
    updateView: function() {
        var numText = this.getValue() || '';                
        var html = '<div class="' + this.getClsValue() + '">'+ numText +'</div>';
        var infoText = this.getInfo();
        if (infoText) {
            html += '<div class="' + this.getClsInfo() + '">'+infoText+'</div>';
        }
        var errorText = this.getError();
        if (errorText) {
            html += '<div class="' + this.getClsError() + '">'+errorText+'</div>';
        }
        this.setHtml(html);
    },
    
    updateValue: function(value) {
        this.updateView();
    },
    
    updateInfo: function(info) {
        this.updateView();
    },
    
    updateError: function(info) {
        this.updateView();
    },
    
    initialize: function() {
        var self = this;
        self.callParent();

        this.element.on({
            scope      : self,
            tap        : 'onTap'
        });
    },
    
    onTap: function(e) {
        this.fireAction('tap', [this, e], 'doTap');
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
    }
});