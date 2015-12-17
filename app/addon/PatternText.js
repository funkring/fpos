/*global Ext:false*/

Ext.define('Ext.field.PatternText', {
    extend : 'Ext.field.Text',
    xtype  : 'patternfield',

    config : {
        pattern : null
    },

    updatePattern : function(pattern) {        
        var c = this.getComponent();
        c.updateFieldAttribute('pattern', pattern);
    }
});