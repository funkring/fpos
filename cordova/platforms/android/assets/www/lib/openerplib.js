var openerplib={};openerplib.json_rpc=function(i,j,l,k){var m={jsonrpc:"2.0",params:l,id:Math.floor((Math.random()*1000000000)+1)};if(j){m.method=j}var n=new XMLHttpRequest();n.open("POST",i,true);n.setRequestHeader("Content-Type","application/json");n.onreadystatechange=function(){if(n.readyState!==4||!k){return}var a=n.getResponseHeader("Content-Type");if(n.status!==200){k("Offline",null)}else{if(a.indexOf("application/json")!==0){k('Expected JSON encoded response, found "'+a+'"',null)}else{var b=JSON.parse(this.responseText);k(b.error||null,b.result||null)}}};n.ontimeout=function(){k("Timeout",null)};try{n.send(JSON.stringify(m))}catch(h){k(h,null)}};openerplib.Service=function(e,f){var d=this;this.con=e;this.service=f;this.exec=function(c,b,a){d.con.send(d.service,c,b,a)}};openerplib.Model=function(f,d){var e=this;this.service=new openerplib.Service(f,"object");this.con=f;this.model=d;this.exec=function(a,h,c,b){e.service.exec("execute_kw",[f.database,f.user_id,f._password,e.model,a,h,c],b)}};openerplib.JsonRPCConnector=function(h,g,j,i,l){var k=this;this._url=h;this._url_jsonrpc=h+"/jsonrpc";this._password=i;this.login=j;this.database=g;this.user_id=l;this.session_id=null;this.user_context=null;this.authenticate=function(c){var a={db:k.database,login:k.login,password:k._password};var b=k._url+"/web/session/authenticate";openerplib.json_rpc(b,null,a,function(d,e){if(d===null){k.session_id=e.session_id;k.user_id=e.uid;k.user_context=e.user_context}if(c){c(d,e)}})};this.send=function(c,a,d,b){openerplib.json_rpc(k._url_jsonrpc,"call",{service:c,method:a,args:d},b)};this.get_service=function(a){return new openerplib.Service(k,a)};this.get_model=function(a){return new openerplib.Model(k,a)}};openerplib.get_connection=function(m,k,i,l,j,n){if(!i){i=8069}var h=m+":"+i.toString();switch(k){case"jsonrpcs":h="https://"+h;break;default:h="http://"+h;break}return new openerplib.JsonRPCConnector(h,l,j,n,null)};