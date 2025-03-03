load_package project
load_package flow

project_open [lindex $argv 0]

set_global_assignment -name [lindex $argv 1] [lindex $argv 2]

project_close