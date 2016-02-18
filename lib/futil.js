/*global Ext:false*/

/**
 * funkring util lib
 */
var futil = {
    comma: ",",
    activetap: false
};

futil.keys = function(obj) {
    if (typeof obj != "object" && typeof obj != "function" || obj === null) {
        throw TypeError("Object.keys called on non-object");
    }
    var keys = [];
    for (var p in obj) 
        if ( obj.hasOwnProperty(p) )
            keys.push(p);
    return keys;
};

futil.dateToStr = function(date) {
    //2016-02-03T22:46:46.011Z
    return date.toISOString().substring(0, 10);
};

futil.datetimeToStr = function(date) {
    //2016-02-03T22:46:46.011Z
    var isoStr = date.toISOString();
    return isoStr.substring(0, 10) + " " + isoStr.substring(11,19);
};

futil.strToDate = function(str) {
    if ( str.length == 19) 
        str = str.substring(0, 10) + "T" + str.substring(11,19) + "Z";
    var date = new Date(str);
    return date;
};

futil.strToIsoDate = function(str) {
    var date = futil.strToDate(str);
    return date.toISOString();
};

futil.strToLocalDateTime = function(str) {
    var date = futil.strToDate(str);
      
};

futil.isDoubleTap = function() {
    if ( !futil.activetap ) {
        futil.activetap = true;
        setTimeout(function() {
            futil.activetap = false;
        },500);
        return false;
    }        
    return true;
};

futil.screenWidth = function() {
    var width = (window.innerWidth > 0) ? window.innerWidth : screen.width;
    return width;
};

futil.screenHeight = function() {
    var height = (window.innerHeight > 0) ? window.innerHeight : screen.height;
    return height;
};

futil.physicalScreenWidth = function() {
    return window.screen.width * window.devicePixelRatio;
};

futil.physicalScreenHeight = function() {
    return window.screen.height * window.devicePixelRatio;
};

futil.hasSmallRes = function() {
    return Math.max(futil.screenWidth(), futil.screenHeight()) < 1024;
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
