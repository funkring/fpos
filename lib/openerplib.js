
/**
 * The Odoo LIB
 */
var openerplib = {
    
};

openerplib.json_rpc = function(url, fct, params, callback, options) {
    var data = {
        jsonrpc : "2.0",
        params: params,
        id: Math.floor((Math.random() * 1000000000) + 1)
    };
    
    //check function
    if (fct) {
        data.method = fct;
    }
    
    var req = new XMLHttpRequest();
    req.open("POST", url, true /*async*/);
    
    // check options
    if ( options ) {
        if ( options.timeout ) {
            req.timeout = options.timeout;
        }
    }
    
    // check handled
    var handled = false;
    var handleCallback = function(err, res) {
        if ( !handled ) {
            handled = true;
            if ( callback ) callback(err, res);
        }
    };
    
    //req.withCredentials = true;
    req.setRequestHeader("Content-Type", "application/json");
    req.onreadystatechange = function () {
        if ( req.readyState == 4 ) {
            var contentType = req.getResponseHeader('Content-Type');
            if (req.status !== 200) {
                handleCallback({name:'Offline',
                       message: 'Server is offline'}, null);
                //callback('Expected HTTP response "200 OK", found "' + req.status + ' ' + req.statusText + '"', null);
            } else if (contentType.indexOf('application/json') !== 0) {
                handleCallback({name:'Invalid Response',
                        message: 'Expected JSON encoded response, found "' + contentType + '"'}, null);
            } else {
                var result = JSON.parse(this.responseText);
                handleCallback(result.error || null, result.result || null);
            }
        }
    };
    req.ontimeout = function() {
       handleCallback({name: 'Timeout',
            message: 'Request not answered'}, null);
    };
    
    // send request
    try {
        req.send(JSON.stringify(data));
    } catch(err) {
        setTimeout(function() {
            handleCallback(err,null);            
        },0);
    }
};

openerplib.Service = function(con, service) {
    var self = this;
    //
    this.con = con;
    this.service = service;
    
    //call function
    this.exec = function(method, args, callback) {                    
                    self.con.send(self.service, method, args, callback);
                };
};

openerplib.Model = function(con, model) {
    var self = this;
    //
    this.service = new openerplib.Service(con, "object"); 
    this.con = con;
    this.model = model;
    
    
    // call function
    this.exec = function(method, args, kwargs, callback) {
                    self.service.exec("execute_kw",
                                 [ con.database, 
                                   con.user_id, 
                                   con._password,
                                   self.model,
                                   method,
                                   args, 
                                   kwargs ],
                                 callback);   
                };
};

/**
 * JsonRPC Connector
 */ 
openerplib.JsonRPCConnector = function(url, database, login, password, user_id) {
    var self = this;
    
    this._url = url;
    this._url_jsonrpc = url + "/jsonrpc";
    this._password = password;   
    this.login = login;
    this.database = database;
    this.user_id = user_id;
    this.session_id = null;
    this.user_context = null;
    
    this.authenticate = function(callback) {
        var params = {
            "db" : self.database,
            "login": self.login,
            "password" : self._password 
        };
        
        var url = self._url + "/web/session/authenticate";
        openerplib.json_rpc(url, null, params, function(err, res) {
            if ( err === null ) {
                // update session data
                self.session_id = res.session_id;
                self.user_id = res.uid;
                self.user_context = res.user_context;
            }
            
            // callback
            if ( callback ) {
                callback(err, res);
            }
        });        
    };
    
    this.send = function(service_name, method, args, callback) {
        openerplib.json_rpc(self._url_jsonrpc, "call", { service: service_name, method: method, args: args }, callback);
    };
    
    this.get_service = function(service_name) {
        return new openerplib.Service(self, service_name);
    };
    
    this.get_model = function(model_name) {
        return new openerplib.Model(self, model_name); 
    };
    
};

    
/**
 * Simple OpenERP Client
 */
openerplib.get_connection = function(host, protocol, port, database, login, password) {
    if ( !port ) {
        port = 8069;
    }    
    
    var url = host + ":" + port.toString();
    switch ( protocol ) {
        case "jsonrpcs":
            url = "https://" + url;
            break;
        default:
            url = "http://" + url;
            break;
    }
      
    return new openerplib.JsonRPCConnector(url, database, login, password, null);
};




