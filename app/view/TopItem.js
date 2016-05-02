/*global Ext:false*/
Ext.define("Fpos.view.TopItem", {
    extend: 'Ext.dataview.component.DataItem',
    xtype: 'fpos_top_item',
    config: {       
        items: [{
            cls: 'TopButton',
            ui: 'posInputButtonBlack',
            xtype: 'button',
            action: 'selectTop',
            topId: null,
            text: ''            
        }]
    },
    
    updateRecord: function(record) {        
        var self = this;
        var button = self.down('button');
        var name = record.get('name') || '';
        
        // config text
        if ( name.length >= 7) {
            button.setCls('TopButtonSmall');
        } else if ( name.length > 5) {
            button.setCls('TopButtonMedium');
        } else {
            button.setCls('TopButton');
        }
        
        // config ui
        if ( record.get('parent') ) {
            button.setUi('posInputButtonOrange');
            button.topId = record.get('parent_id');
        } else if ( record.get('selected') ) {
            button.setUi('posInputButtonGray');
            button.topId = record.getId();
        } else {
            button.setUi('posInputButtonBlack');
            button.topId = record.getId();                      
        }
        
        // text
        button.setText(name);
    }
    
});