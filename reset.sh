#!/bin/zsh

ife() {
    if [[ $1 -ne 0 ]]; then
        print 'Failure detected. Exiting. Code = ' $1
        exit $1
    fi;
}
print $1
if [[ "${1}" == 'forcez' ]]; then 
    print 'slsdflsjdflksjd'
fi;
if [[ $? -eq 0 || "$1" == 'force' ]]; then 
    cordova plugin rm org.apache.cordova.console
    cordova plugin rm org.allseen.alljoyn
    cordova platform rm ios
    ife $?

    cordova plugin add org.apache.cordova.console
    ife $?
    cordova plugin add ~/github/cordova-plugin-alljoyn
    ife $?
    cordova platform add ios
    ife $?

    cordova build ios
    ife $?
else
    print 'There are differences in AllJoyn_Cordova.m'
    print 'Please make sure you do not lose work'
fi;
