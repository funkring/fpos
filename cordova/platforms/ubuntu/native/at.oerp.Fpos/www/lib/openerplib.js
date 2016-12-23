var openerplib={};openerplib.json_rpc=function(a,g,e,f){var d={jsonrpc:"2.0",params:e,id:Math.floor((Math.random()*1000000000)+1)};if(g){d.method=g}var c=new XMLHttpRequest();c.open("POST",a,true);c.setRequestHeader("Content-Type","application/json");c.onreadystatechange=function(){if(c.readyState!==4||!f){return}var i=c.getResponseHeader("Content-Type");if(c.status!==200){f("Offline",null)}else{if(i.indexOf("application/json")!==0){f('Expected JSON encoded response, found "'+i+'"',null)}else{var h=JSON.parse(this.responseText);f(h.error||null,h.result||null)}}};c.ontimeout=function(){f("Timeout",null)};try{c.send(JSON.stringify(d))}catch(b){f(b,null)}};openerplib.Service=function(a,c){var b=this;this.con=a;this.service=c;this.exec=function(d,e,f){b.con.send(b.service,d,e,f)}};openerplib.Model=function(c,b){var a=this;this.service=new openerplib.Service(c,"object");this.con=c;this.model=b;this.exec=function(e,f,g,d){a.service.exec("execute_kw",[c.database,c.user_id,c._password,a.model,e,f,g],d)}};openerplib.JsonRPCConnector=function(a,b,e,f,c){var d=this;this._url=a;this._url_jsonrpc=a+"/jsonrpc";this._password=f;this.login=e;this.database=b;this.user_id=c;this.session_id=null;this.user_context=null;this.authenticate=function(g){var i={db:d.database,login:d.login,password:d._password};var h=d._url+"/web/session/authenticate";openerplib.json_rpc(h,null,i,function(k,j){if(k===null){d.session_id=j.session_id;d.user_id=j.uid;d.user_context=j.user_context}if(g){g(k,j)}})};this.send=function(j,h,i,g){openerplib.json_rpc(d._url_jsonrpc,"call",{service:j,method:h,args:i},g)};this.get_service=function(g){return new openerplib.Service(d,g)};this.get_model=function(g){return new openerplib.Model(d,g)}};openerplib.get_connection=function(d,f,a,e,g,c){if(!a){a=8069}var b=d+":"+a.toString();switch(f){case"jsonrpcs":b="https://"+b;break;default:b="http://"+b;break}return new openerplib.JsonRPCConnector(b,e,g,c,null)};