#!/bin/sh
[ -f ~/.build-environment ] && . ~/.build-environment
cordova plugin remove cordova-plugin-poshw
cordova plugin add $CORDOVA_PLUGIN_HOME/cordova-plugin-poshw
cordova plugin remove cordova-plugin-payworks
cordova plugin add $CORDOVA_PLUGIN_HOME/cordova-plugin-payworks
