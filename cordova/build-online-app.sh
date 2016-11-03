#!/bin/sh
rsync -avz ../ --exclude=".git" --exclude="*.log" --exclude="cordova" --exclude="build" --delete -e ssh root@app.oerp.at:/var/www/fpos/
