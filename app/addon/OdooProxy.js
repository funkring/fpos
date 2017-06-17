/*global Ext:false, futil:false */

/**
 * reader
 */
Ext.define('Ext.data.reader.JsonOdoo', {
    extend: 'Ext.data.reader.Json',
    alias : 'reader.odoo',

    createFieldAccessExpression: function(field, fieldVarName, dataName) {
        var me     = this,
            re     = me.objectRe,
            hasMap = (field.getMapping() !== null),
            map    = hasMap ? field.getMapping() : field.getName(),
            result, operatorSearch;

        if (typeof map === 'function') {
            result = fieldVarName + '.getMapping()(' + dataName + ', this)';
        }
        else if (me.getUseSimpleAccessors() === true || ((operatorSearch = String(map).search(re)) < 0)) {
            if (!hasMap || isNaN(map)) {
                // If we don't provide a mapping, we may have a field name that is numeric
                map = '"' + map + '"';
            }
            result = dataName + "[" + map + "]";
        }
        else {
            result = dataName + (operatorSearch > 0 ? '.' : '') + map;
        }

        return result + " || null";
    }
});

/**
 * proxy
 */
Ext.define('Ext.data.proxy.Odoo',{
    extend: 'Ext.data.proxy.Ajax',
    alias: 'proxy.odoo',
    requires: [ 'Ext.data.reader.Json', 
                'Ext.data.writer.Json'],
    config: {
        
        startParam: null,
        limitParam: null,
        pageParam: null,
        batchActions: false,
                
        reader: {
             type: 'odoo',
             rootProperty: 'result'
        },
        
        writer: {
             type: 'json',
             encodeRequest: true            
        }, 
         
        
        sortParam: null,
        filterParam: null,
        
        resModel: null,
        client: null,
        recordDefaults: null,
        domain: null,
        
        headers: {
             'Content-Type': 'application/json' 
        }
    },
   
    constructor: function(config) {
        this.callParent(arguments);        
    },
    
    buildUrl: function(request) {
        return this.getClient()._url_jsonrpc;       
    },
   
    buildRequest: function(operation) {       
        var request = this.callParent(arguments);
        
        var client = this.getClient();
        var action = operation.getAction();
        var model = operation.getModel();
        
        var args = null;
        var cmd = null;
        var kwargs = {};

        if ( action === 'read' ) {
            cmd = 'search_read';
            var domain = [];
            
            // add default domain
            var defaultDomain = this.getDomain();
            if ( defaultDomain ) {
                Ext.each(defaultDomain, function(val) {
                   domain.push(val); 
                });
            }
            
            // add filter
            var filters = operation.getFilters();
            if ( filters ) {
                Ext.each(filters, function(filter) {
                    var op = '=';
                    if (filter.anyMatch ) {
                        if ( filter.caseSensitive ) {
                            op = 'like';
                        } else {
                            op = 'ilike';                            
                        }
                    } 
                    domain.push([filter.property,op,filter.value]);
                });
            }
            
            // add sort
            var sorters = operation.getSorters();
            if ( sorters ) {
                var order = '';
                Ext.each(sorters, function(sorter) {
                    if ( order.length > 0 ) {
                        order += ", ";
                    }
                    
                    order += sorter.property;
                    order += ' ';
                    
                    if (sorter.direction) order += sorter.direction;
                });
                
                if ( order.length > 0 ) kwargs.order = order;
            }
            
            var fields = [];
            Ext.each(model.getFields().items, function(field) {
               fields.push(field.getName()); 
            });

            // add args
            args = [
                domain,
                fields
            ];
            
            var op_params = operation.getParams();
            if ( op_params ) {
                kwargs.limit = op_params.limit || 100;
            }            
        } else if ( action == 'update' ) {
           cmd = 'write';
           // handle only one record
           Ext.each(operation.getRecords(), function(record) {
               args = [
                    record.getData().id,
                    record.getData()
               ];
           });
        } else if ( action == 'create' ) {
            cmd = 'create';
            // handle only one record
            Ext.each(operation.getRecords(), function(record) {
               args = [                   
                    record.getData()
               ];
            });
        }
        
        var params = [           
            client.database,
            client.user_id,
            client._password,
            this.getResModel(),
            cmd,
            args,
            kwargs                              
        ];
        
        var data = {
            jsonrpc : '2.0',
            method: 'call',
            params: {
                service: 'object',
                method: 'execute_kw',
                args: params
            },
            id: Math.floor((Math.random() * 1000000000) + 1)
        };
        
        request.setParams(null);
        request.setJsonData(data);
        
        return request;
    }
    
    /*
    processResponse: function(success, operation, request, response, callback, scope) {
        return this.callParent(arguments);
    }*/
    
});