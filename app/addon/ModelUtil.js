/*global Ext:false, futil:false*/

Ext.define('Ext.data.ModelUtil', {
    alternateClassName: 'ModelUtil',
    singleton: true,
    requires: [
      'Ext.data.Model'
    ],
    config : {
    },
    
    constructor: function(config) {
        this.initConfig(config);
    },

    /**
     * write date
     */   
    writeDate: function(field, date) {
        if (Ext.isEmpty(date)) {
            return null;
        }

        var dateFormat = field.getDateFormat() || this.getDefaultDateFormat();
        switch (dateFormat) {
            case 'timestamp':
                return date.getTime() / 1000;
            case 'time':
                return date.getTime();
            default:
                return Ext.Date.format(date, dateFormat);
        }
    },
       
   /**
    * @param {Object} record
    * create Document
    * @return Document
    */
    createDocument: function(record, defaults, includeTransient) {
        var fields  = record.getFields().items;
        var length  = fields.length;
        var data    = record.data;
        var doc     = {};
        
        // set defaults
        if ( defaults ) {
            for (var key in defaults) {
                doc[key]=defaults[key];
            }
        }

        // set fields        
        var i, field, name, value;
        for (i = 0; i < length; i++) {            
            field = fields[i];
            name  = field.getName();
            value = data[name];
            
            // ignore auto fields
            if ( name == "id" ) continue;
            
            // set default if undefined
            if ( defaults && value === undefined ) {
                value = defaults[name];
            }

            // check for undefined and persist
            if ( value === undefined || (field.getPersist() === false && !includeTransient) ) {
                if ( doc[name] ) {
                    delete doc[name];
                }
                continue;
            }
            
            if (typeof field.getDecode() == 'function') {
                doc[name] = field.getEncode()(value, record);
            }  else {
                if (field.getType().type == 'date' && Ext.isDate(value)) {
                    doc[name] = this.writeDate(field, value);
                } else {
                    doc[name] = value;
                }
            }
        }
        return doc;
    }
});