#!/usr/bin/python

import glob
import os
from xml.etree import ElementTree

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

# read source
sourceFiles = set()
pluginRoot = ElementTree.parse("plugin.xml")
for sourceFile in pluginRoot.findall(".//{http://apache.org/cordova/ns/plugins/1.0}source-file"):
    sourceFiles.add(sourceFile.get("src"))

# output
for srclist, dest in process:
    for src in srclist:
        for root, directories, files in os.walk(src):
            for file in files:
                if file.startswith("android-support-v"):
                    continue
                source_path = os.path.join(root, file)
                dest_path = os.path.dirname(os.path.join(dest,source_path[len(src)+1:]))
                if not source_path in sourceFiles:
                    print '\t\t<source-file src="%s" target-dir="%s" />' % (source_path, dest_path+"/")
    print
