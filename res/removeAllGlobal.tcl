load_package project
load_package flow

project_open [lindex $argv 0]

remove_all_global_assignments -name [lindex $argv 1]

project_close