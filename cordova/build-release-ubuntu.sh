#!/bin/sh

ALIAS=fpos

echo "Build..."
cordova build --release ubuntu

echo "Pack..."
cp ./platforms/ubuntu/fpos.desktop ./platforms/ubuntu/native/prefix/
tar -vczf /tmp/fpos-ubuntu.tar.gz -C ./platforms/ubuntu/native/prefix .
scp /tmp/fpos-ubuntu.tar.gz root@s3-web.funkring.net:/var/www/downloads

echo "Published!"
