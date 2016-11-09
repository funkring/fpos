#!/bin/sh

echo "build..."
cordova build --release ubuntu

DIST_DIR=~/Work/odoo/addons-funkring-extra/fpos/static/app
if [ -d $DIST_DIR ]; then
	rsync -av --delete ./platforms/ubuntu/native/prefix/www/ $DIST_DIR/
	echo "merged into $DIST_DIR"
fi
 
