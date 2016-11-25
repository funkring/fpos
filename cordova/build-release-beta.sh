#!/bin/sh

ALIAS=fpos
APK=./platforms/android/build/outputs/apk/android-armv7-release-unsigned.apk
APK_RELEASE=${APK%%-unsigned.apk}.apk
APK_PUBLISH=root@downloads.oerp.at:/var/www/downloads/${ALIAS}_beta.apk

echo "Build $APK_RELEASE"

# build
cordova build --release android

# sign
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore android.keystore $APK $ALIAS 
rm $APK_RELEASE 
zipalign -v 4 $APK $APK_RELEASE

# publish
scp $APK_RELEASE $APK_PUBLISH





