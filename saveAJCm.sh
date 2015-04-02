#!/bin/zsh

confirm() {
    local answer
    echo -ne "zsh: sure you want to run '${YELLOW}$*${NC}' [yN]? "
    read -q answer
        echo
    if [[ "${answer}" =~ ^[Yy]$ ]]; then
        command "${@}"
    else
        return 1
    fi
}

print 'Trying to save AllJoyn_Cordova.m'

print platforms/**/*AllJoyn_Cordova.m
print ~/github/cordova-plugin-alljoyn/**/*AllJoyn_Cordova.m

confirm cp platforms/**/*AllJoyn_Cordova.m ~/github/cordova-plugin-alljoyn/**/*AllJoyn_Cordova.m
confirm cp platforms/**/*AllJoyn_Cordova.h ~/github/cordova-plugin-alljoyn/**/*AllJoyn_Cordova.h
