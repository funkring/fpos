var openerplib={};openerplib.json_rpc=function(d,c,a,b){var g={jsonrpc:"2.0",params:a,id:Math.floor((Math.random()*1000000000)+1)};if(c){g.method=c}var f=new XMLHttpRequest();f.open("POST",d,true);f.setRequestHeader("Content-Type","application/json");f.onreadystatechange=function(){if(f.readyState!==4||!b){return}var i=f.getResponseHeader("Content-Type");if(f.status!==200){b("Offline",null)}else{if(i.indexOf("application/json")!==0){b('Expected JSON encoded response, found "'+i+'"',null)}else{var h=JSON.parse(this.responseText);b(h.error||null,h.result||null)}}};f.ontimeout=function(){b("Timeout",null)};try{f.send(JSON.stringify(g))}catch(e){b(e,null)}};openerplib.Service=function(c,b){var a=this;this.con=c;this.service=b;this.exec=function(e,f,d){a.con.send(a.service,e,f,d)}};openerplib.Model=function(b,a){var c=this;this.service=new openerplib.Service(b,"object");this.con=b;this.model=a;this.exec=function(g,d,e,f){c.service.exec("execute_kw",[b.database,b.user_id,b._password,c.model,g,d,e],f)}};openerplib.JsonRPCConnector=function(c,d,a,b,e){var f=this;this._url=c;this._url_jsonrpc=c+"/jsonrpc";this._password=b;this.login=a;this.database=d;this.user_id=e;this.session_id=null;this.user_context=null;this.authenticate=function(h){var g={db:f.database,login:f.login,password:f._password};var i=f._url+"/web/session/authenticate";openerplib.json_rpc(i,null,g,function(k,j){if(k===null){f.session_id=j.session_id;f.user_id=j.uid;f.user_context=j.user_context}if(h){h(k,j)}})};this.send=function(h,j,g,i){openerplib.json_rpc(f._url_jsonrpc,"call",{service:h,method:j,args:g},i)};this.get_service=function(g){return new openerplib.Service(f,g)};this.get_model=function(g){return new openerplib.Model(f,g)}};openerplib.get_connection=function(g,b,d,a,c,f){if(!d){d=8069}var e=g+":"+d.toString();switch(b){case"jsonrpcs":e="https://"+e;break;default:e="http://"+e;break}return new openerplib.JsonRPCConnector(e,a,c,f,null)};