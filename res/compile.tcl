load_package project
load_package flow

project_open [lindex $argv 0]

execute_flow -compile

project_close