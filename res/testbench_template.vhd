----------------------------------------------------------------------
-- @file    TESTBENCH_ENTITY_tp.vhd
-- @brief   Testbench for design "TESTBENCH_ENTITY"
-- @date    DATE_CREATED
-- @version v1.0.0
-- @author  sprensev
----------------------------------------------------------------------

library ieee;
use ieee.std_logic_1164.all;
use ieee.numeric_std.all;
use work.all;
use std.textio.all;
use work.simulation_pkg.all;
use work.standard_driver_pkg.all;
use work.user_driver_pkg.all;

entity TESTBENCH_ENTITY_tb is
end entity TESTBENCH_ENTITY_tb;

architecture struct of TESTBENCH_ENTITY_tb is

    component TESTBENCH_ENTITY is
        ENTITY_CONTENT
    end component TESTBENCH_ENTITY;

    TESTBENCH_INTERNAL_SIGNALS

    constant clock_freq : natural := 50_000_000;
    constant clock_period : time := 1000 ms/clock_freq;

begin
    DUT : TESTBENCH_ENTITY
    port map(
        ENTITY_INTERAL_MAPPING
    );

    readcmd : process
        variable cmd : string(1 to 7); --stores test command
        variable line_in : line; --stores the to be processed line
        variable tv : test_vect; --stores arguments 1 to 4
        variable lincnt : integer := 0; --counts line number in testcase file
        variable fail_counter : integer := 0; --counts failed tests

    begin
        FILE_OPEN(cmdfile, "../testcase.dat", read_mode);
        FILE_OPEN(outfile, "../results.dat", write_mode);

        loop
            -- check if end of file has been reached
            if endfile(cmdfile) then -- Check EOF
                end_simulation(fail_counter);
                exit;
            end if;

            -- Read one command (one line) from file
            readline(cmdfile, line_in);
            lincnt := lincnt + 1;

            -- Skip line that contain nothing and lines that are comment
            next when line_in'length = 0;
            next when line_in.all(1) = '#';

            -- Read arguments of command
            read_arguments(lincnt, tv, line_in, cmd); --
            tv.clock_period := clock_period;

            ------------------------------
            -- Implement you tests here --
            ------------------------------

            if tv.fail_flag = true then
                fail_counter := fail_counter + 1;
            else
                fail_counter := fail_counter;
            end if;

        end loop;

        wait;

    end process;

    clkgen : process
    begin
        clock_50 <= '0';
        wait for 1 * clock_period /2;
        clock_50 <= '1';
        wait for 1 * clock_period /2;

    end process clkgen;
end architecture struct;