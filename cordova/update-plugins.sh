#!/bin/sh
[ -f ~/.build-environment ] && . ~/.build-environment
cordova plugin remove cordova-plugin-poshw
cordova plugin add src/cordova-plugin-poshw
cordova plugin remove cordova-plugin-payworks
cordova plugin add src/cordova-plugin-payworks
