/*global Ext:false*/

/**
 * funkring util lib
 */
var futil = {
    comma: ",",
    activetap: false
};

futil.isDoubleTap = function() {
    if ( !futil.activetab ) {
        futil.activetab = true;
        setTimeout(function() {
            futil.activetab = false;
        },1000);
        return false;
    }        
    return true;
};

futil.startLoading = function(msg) {
    Ext.Viewport.setMasked({xtype: 'loadmask', message: msg});    
};
    
futil.stopLoading = function() {
    Ext.Viewport.setMasked(false);
};

futil.screenWidth = function() {
    var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
    return width;
};

futil.screenHeight = function() {
    var height = (window.innerHeight > 0) ? window.innerHeight : screen.height;
    return height;
};

futil.formatFloat = function(num, digits) {    
    if ( !num) {
        num = 0.0;
    }
    
    if (digits === 0) {
        return num.toString().replace(".",futil.comma);    
    } else if (!digits) {
        digits=2;
    }
    
    return num.toFixed(digits).replace(".",futil.comma);  
};


futil.parseFloat = function(num) {
    if (!num) {
        return 0.0;
    }
    return parseFloat(num.replace(futil.comma,"."));
};


futil.Barrier = function(callback, args) {
  this.callback = callback;
  this.ref = 1;
  
  this.add = function(count) {
    if ( count ) {
        this.ref+=count;   
    } else {
        this.ref++;
    }  
  };
  
  this.test = function() {
    if ( --this.ref === 0 ) {
        this.callback(args);
    }      
  };
    
};
