#!/usr/bin/python

import glob
import os

source = [
   "cordova/android/src",
   "src"          
]

libs = [
    "libs"
]

drawable = [
    "res/drawable"
]

process = [(source,"src"), (libs,"libs"), (drawable,"res/drawable")]

print

for srclist, dest in process:
    for src in srclist:
        for root, directories, files in os.walk(src):
            for file in files:
                if file.startswith("android-support-v"):
                    continue
                source_path = os.path.join(root, file)
                dest_path = os.path.dirname(os.path.join(dest,source_path[len(src)+1:]))
                #if dest_path.endswith("armeabi"):
                #    dest_path = "armeabi-v7a"
                print '<source-file src="%s" target-dir="%s" />' % (source_path, dest_path+"/")
    print
