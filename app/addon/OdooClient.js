/*global Ext:false,PouchDB:false*,openerplib:false,futil:false*/

/*
 * Odoo Client
 */
Ext.define('Ext.client.OdooClient',{
    alternateClassName: 'OdooClient',

    requires: [    
        'Ext.ux.Deferred'
    ],

    config: {
        host: null,
        port: null,
        protocol: "jsonrpc",
        database: null,
        login: null,
        password: null,
        client: null
    },
    
    // needed, config load
    constructor : function (config) {
        this.initConfig(config);
    },
    
    applyPort: function(port) {
      if (typeof port === 'string') {
        return parseInt(port,10);
      } 
      return port;
    },    
    
    /*
     * connect
     */
    connect: function() {
        var self = this;
        self.setClient(null);
        
        var client = openerplib.get_connection(self.getHost(), 
                                            self.getProtocol(), 
                                            self.getPort(), 
                                            self.getDatabase(), 
                                            self.getLogin(), 
                                            self.getPassword());
        
        
        var deferred = Ext.create('Ext.ux.Deferred'); 
        client.authenticate( function(err) {            
            if (err) {
                deferred.reject(err);
            } else {
                self.setClient(client);
                deferred.resolve();                
            }
        });
        
        return deferred.promise();
        
    },
    
    /*
     * call service method
     */
    call: function(service_name, method, args) {
        var self = this;
        var client = self.getClient();
        if ( !client ) {
            throw {
                name: "No Connection",
                message: "No Client Connection to execute command"
            };
        }
        
        var deferred = Ext.create('Ext.ux.Deferred');
        client.send(service_name, method, args, function(err, result) {
           if (err) {            
                deferred.reject(err);
            } else {
                deferred.resolve(result);                
            }
        });    
        return deferred.promise();
    },
    
    /*
     * invoke model method
     */
    invoke: function(model, method, args, kwargs) {
        var self = this;
        var client = self.getClient();
        
        // args
        if ( !args ) {
            args = [];
        }
        
        // kwargs
        if ( !kwargs ) {
            kwargs = {};
        }
        
        if ( !kwargs.context ) {
            kwargs.context = client.user_context;    
        }
        
        // params
        var params = [
            client.database,
            client.user_id,
            client._password,
            model,
            method,
            args,
            kwargs
        ];        
        
        return self.call("object", "execute_kw", params);
    }    
     
});