load_package project
load_package flow

project_open [lindex $argv 0]

set readGlobal [get_all_global_assignments -name [lindex $argv 1]]

foreach_in_collection assignment $readGlobal {
    puts [lindex $assignment 2]
}

project_close