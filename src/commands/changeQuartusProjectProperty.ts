import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';

// Import custom libs
import * as entityUtils from './../lib/EntityUtils';
import * as testbenchCommands from './../lib/TestbenchCommand';
import * as tomlUtils from './../lib/TomlUtils';
import * as quartus from './../lib/QuartusUtils';
import * as questa from './../lib/QuestaUtils';
import * as compileCommands from './../lib/CompileCommand';
import * as testCommands from './../lib/TestCommands';
import * as statusBarCreator from './../lib/StatusBarUtils';
import * as pathUtils from './../lib/PathUtils';
import * as vhdlLang from './../lib/VhdlLang';

import { outputChannel, quartusProjectFilesView, quartusProjectPropertiesView, currentQuestaProjectDisplay, runQuestaTestsButton, currentQuartusProjectDisplay, currentTopLevelDisplay } from '../extension';

export function getCommand(context: vscode.ExtensionContext) {
    return vscode.commands.registerCommand('vhdl-qqs.changeQuartusProjectProperty', async (element) => {
        // Get currently active project
        const activeProject: string | null = await pathUtils.getCurrentQuartusProject(context);
        if (activeProject === null) { return; }

        // Get  quartus install bin path
        const quartusPath: string | null = await pathUtils.getQuartusBinPath();
        if (quartusPath === null) { return; }

        switch (element.name) {
            case 'Device':
            case 'Family':
                const availableFamilies: string[] | null = quartus.getAvailableChipFamilies(context, quartusPath);
                if (availableFamilies === null) { return; }

                const selectedFamily: string | undefined = await vscode.window.showQuickPick(availableFamilies, { title: 'Select a chip family' });
                if (selectedFamily === undefined) { return; }

                const availableChips = quartus.getAvailableChips(context, quartusPath, selectedFamily);
                if (availableChips === null) { return; }

                const selectedChip: string | undefined = await vscode.window.showQuickPick(availableChips, { title: 'Select a chip' });
                if (selectedChip === undefined) { return; }

                quartus.setProjectGlobal(context, activeProject, quartusPath, 'FAMILY', selectedFamily);
                quartus.setProjectGlobal(context, activeProject, quartusPath, 'DEVICE', selectedChip);
                break;

            case 'VHDL Version':
                const availableVhdlVersions = quartus.getAvailableVhdlVersions();

                // Ask user to select a vhdl version
                const selectedVhdlVersion: string | undefined = await vscode.window.showQuickPick(availableVhdlVersions, { title: 'Select a VHDL version' });
                if (selectedVhdlVersion === undefined) { return; }

                quartus.setProjectGlobal(context, activeProject, quartusPath, 'VHDL_INPUT_VERSION', selectedVhdlVersion);
                break;

            case 'Verilog Version':
                const availableVerilogVersions = quartus.getAvailableVerilogVersions();

                // Ask user to select a vhdl version
                const selectedVerilogVersion: string | undefined = await vscode.window.showQuickPick(availableVerilogVersions, { title: 'Select a VHDL version' });
                if (selectedVerilogVersion === undefined) { return; }

                quartus.setProjectGlobal(context, activeProject, quartusPath, 'VERILOG_INPUT_VERSION', selectedVerilogVersion);
                break;

            default:
                break;
        }

        quartusProjectPropertiesView.updateData(context, activeProject, quartusPath);
    });
} 