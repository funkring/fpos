var openerplib={};openerplib.json_rpc=function(d,c,a,b){var g={jsonrpc:"2.0",params:a,id:Math.floor((Math.random()*1000000000)+1)};if(c){g.method=c}var f=new XMLHttpRequest();f.open("POST",d,true);f.setRequestHeader("Content-Type","application/json");f.onreadystatechange=function(){if(f.readyState!==4||!b){return}var i=f.getResponseHeader("Content-Type");if(f.status!==200){b("Offline",null)}else{if(i.indexOf("application/json")!==0){b('Expected JSON encoded response, found "'+i+'"',null)}else{var h=JSON.parse(this.responseText);b(h.error||null,h.result||null)}}};f.ontimeout=function(){b("Timeout",null)};try{f.send(JSON.stringify(g))}catch(e){b(e,null)}};openerplib.Service=function(a,c){var b=this;this.con=a;this.service=c;this.exec=function(d,e,f){b.con.send(b.service,d,e,f)}};openerplib.Model=function(c,b){var a=this;this.service=new openerplib.Service(c,"object");this.con=c;this.model=b;this.exec=function(e,f,g,d){a.service.exec("execute_kw",[c.database,c.user_id,c._password,a.model,e,f,g],d)}};openerplib.JsonRPCConnector=function(a,b,e,f,c){var d=this;this._url=a;this._url_jsonrpc=a+"/jsonrpc";this._password=f;this.login=e;this.database=b;this.user_id=c;this.session_id=null;this.user_context=null;this.authenticate=function(g){var i={db:d.database,login:d.login,password:d._password};var h=d._url+"/web/session/authenticate";openerplib.json_rpc(h,null,i,function(k,j){if(k===null){d.session_id=j.session_id;d.user_id=j.uid;d.user_context=j.user_context}if(g){g(k,j)}})};this.send=function(j,h,i,g){openerplib.json_rpc(d._url_jsonrpc,"call",{service:j,method:h,args:i},g)};this.get_service=function(g){return new openerplib.Service(d,g)};this.get_model=function(g){return new openerplib.Model(d,g)}};openerplib.get_connection=function(g,b,d,a,c,f){if(!d){d=8069}var e=g+":"+d.toString();switch(b){case"jsonrpcs":e="https://"+e;break;default:e="http://"+e;break}return new openerplib.JsonRPCConnector(e,a,c,f,null)};