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
        
        // get button
        var button = self.down('button');
        
        // config text
        var name = record.get('name') || '';
        if ( name.length >= 7) {
            button.setCls('TopButtonSmall');
        } else if ( name.length > 5) {
            button.setCls('TopButtonMedium');
        } else {
            button.setCls('TopButton');
        }
        
        // config ui
        var ui = 'posInputButtonBlack';
        if ( record.get('parent') ) {
            ui = 'posInputButtonOrange';
            button.topId = record.get('parent_id');
        } else if ( record.get('selected') ) {
            ui = 'posInputButtonGray';
            button.topId = record.getId();
        } else {
            var color = record.get('pos_color');
            if ( color ) {
                ui = 'posInputButton-'+color;
            }
            button.topId = record.getId();                      
        }
        if ( button.getUi() !== ui ) {
            button.setUi(ui);
        }
        
        // text
        button.setText(name);
    }
    
});