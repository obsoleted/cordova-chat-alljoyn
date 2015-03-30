#!/bin/zsh

cordova platform rm ios
cordova plugin rm org.allseen.alljoyn
cordova plugin rm org.apache.cordova.console

cordova plugin add /users/obsoleted/code/github/cordova-plugin-alljoyn
cordova plugin add org.apache.cordova.console
cordova platform add ios
