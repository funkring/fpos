var openerplib={};openerplib.json_rpc=function(g,f,d,e){var c={jsonrpc:"2.0",params:d,id:Math.floor((Math.random()*1000000000)+1)};if(f){c.method=f}var b=new XMLHttpRequest();b.open("POST",g,true);b.setRequestHeader("Content-Type","application/json");b.onreadystatechange=function(){if(b.readyState!==4||!e){return}var i=b.getResponseHeader("Content-Type");if(b.status!==200){e("Offline",null)}else{if(i.indexOf("application/json")!==0){e('Expected JSON encoded response, found "'+i+'"',null)}else{var h=JSON.parse(this.responseText);e(h.error||null,h.result||null)}}};b.ontimeout=function(){e("Timeout",null)};try{b.send(JSON.stringify(c))}catch(a){e(a,null)}};openerplib.Service=function(a,c){var b=this;this.con=a;this.service=c;this.exec=function(d,e,f){b.con.send(b.service,d,e,f)}};openerplib.Model=function(c,b){var a=this;this.service=new openerplib.Service(c,"object");this.con=c;this.model=b;this.exec=function(e,f,g,d){a.service.exec("execute_kw",[c.database,c.user_id,c._password,a.model,e,f,g],d)}};openerplib.JsonRPCConnector=function(a,b,e,f,c){var d=this;this._url=a;this._url_jsonrpc=a+"/jsonrpc";this._password=f;this.login=e;this.database=b;this.user_id=c;this.session_id=null;this.user_context=null;this.authenticate=function(g){var i={db:d.database,login:d.login,password:d._password};var h=d._url+"/web/session/authenticate";openerplib.json_rpc(h,null,i,function(k,j){if(k===null){d.session_id=j.session_id;d.user_id=j.uid;d.user_context=j.user_context}if(g){g(k,j)}})};this.send=function(j,h,i,g){openerplib.json_rpc(d._url_jsonrpc,"call",{service:j,method:h,args:i},g)};this.get_service=function(g){return new openerplib.Service(d,g)};this.get_model=function(g){return new openerplib.Model(d,g)}};openerplib.get_connection=function(c,e,g,d,f,b){if(!g){g=8069}var a=c+":"+g.toString();switch(e){case"jsonrpcs":a="https://"+a;break;default:a="http://"+a;break}return new openerplib.JsonRPCConnector(a,d,f,b,null)};