import * as vscode from 'vscode';
import * as path from 'path';;
import * as fs from 'fs';
import * as cp from 'child_process';
import { pipeline } from 'stream/promises';
import extract from 'extract-zip';
import { outputChannel } from '../extension';

// Names of releases
const WIN32_FILE_NAME = 'vhdl_lang-x86_64-pc-windows-msvc.zip';
const LINUX_FILE_NAME = 'vhdl_lang-x86_64-unknown-linux-gnu.zip';

type GitHubReleaseJson = {
    tag_name: string;
}

/**
 * @brief Function checks if a vhdl_lang binary is present in extension path
 * 
 * @param context The context form where the function was ran
 * 
 * @returns Boolean based on if binary is present
 */
export function checkForVhdlLang(context: vscode.ExtensionContext): boolean {
    let pathToVhdlLang = path.join(context.extensionPath, 'res');
    const currentPlatform: string = process.platform;
    let binaryName: string = '';

    // Check what platform is used
    switch (currentPlatform) {
        case 'win32':
            binaryName = 'vhdl_lang.exe';
            break;

        case 'linux':
            binaryName = 'vhdl_lang';
            break;

        default:
            vscode.window.showErrorMessage('Your platform isn\'t supported by this extension!');
            console.error('Your platform isn\'t supported by this extension!');
            outputChannel.appendLine('Your platform isn\'t supported by this extension!');
            return false;
    }

    pathToVhdlLang = path.join(pathToVhdlLang, binaryName);

    // Check if VHDL_lang binary is present
    return fs.existsSync(pathToVhdlLang);
}

/**
 * @brief Function that get the version of the local vhdl_lang binary
 * 
 * @param context The context form where the function was ran
 * 
 * @returns Version number of vhdl_lang
 */
export function getVhdlLangVersion(context: vscode.ExtensionContext): string {
    const pathToVhdlLang = path.join(context.extensionPath, 'res', 'vhdl_lang');

    // Get version from binary
    let cliOutput: string = '';
    
        try {
            cliOutput = cp.execSync('"' + pathToVhdlLang + '" --version').toString();
        }
        catch {
            console.error('Error while executing "' + '"' + pathToVhdlLang + '" --version' + '"!\nstdout dump:\n' + cliOutput);
            vscode.window.showErrorMessage('Error while executing "' + '"' + pathToVhdlLang + '" --version' + '"!\nstdout dump:\n' + cliOutput);
            outputChannel.appendLine('Error while executing "' + '"' + pathToVhdlLang + '" --version' + '"!\nstdout dump:\n' + cliOutput);
        }

    return cliOutput.replace('vhdl_lang ', '').replace('\n', '');
}

/**
 * @brief Function that get the version of the most current vhdl_lang binary from GitHub
 * 
 * @returns Version number of vhdl_lang
 */
export async function getLatestReleaseFromGithub(): Promise<string | null> {
    // Get latest tag from GitHub API
    const response = await fetch('https://api.github.com/repos/VHDL-LS/rust_hdl/releases/latest');

    // Check if request was successful
    if (response.status !== 200) {
        return null;
    }

    // Parse data and return tag name
    const data: GitHubReleaseJson = (await response.json()) as GitHubReleaseJson;
    return data.tag_name.replace('v', '');
}

/**
 * @brief Downloads, unpacks and overwrites the vhdl_lang binary stored in extension path
 * 
 * @param context The context form where the function was ran
 * 
 * @returns Version number of vhdl_lang
 */
export async function getVhdlLangExecutable(context: vscode.ExtensionContext): Promise<void> {
    let pathToVhdlLang = path.join(context.extensionPath, 'res');

    // Current platform
    const currentPlatform: string = process.platform;

    // Base url for download
    const downloadUrl: string = 'https://github.com/VHDL-LS/rust_hdl/releases/latest/download/';

    let fileName: string = '';
    let binaryName: string = '';

    // Check what platform is used
    switch (currentPlatform) {
        case 'win32':
            fileName = WIN32_FILE_NAME;
            binaryName = 'vhdl_lang.exe';
            break;

        case 'linux':
            fileName = LINUX_FILE_NAME;
            binaryName = 'vhdl_lang';
            break;

        default:
            vscode.window.showErrorMessage('Your platform isn\'t supported by this extension!');
            console.error('Your platform isn\'t supported by this extension!');
            outputChannel.appendLine('Your platform isn\'t supported by this extension!');
            return;
    }

    vscode.window.showInformationMessage('Downloading VHDL_lang!');
    console.log('Downloading VHDL_lang!');
    outputChannel.appendLine('Downloading VHDL_lang!');

    pathToVhdlLang = path.join(pathToVhdlLang, binaryName);

    // Delete old version of binary
    if (fs.existsSync(pathToVhdlLang)) { fs.rmSync(pathToVhdlLang); }

    // Generate path for zip file to download
    const pathToZip: string = pathToVhdlLang.replace(path.extname(pathToVhdlLang), '') + '.zip';

    console.log('Downloading VHDL_lang release to "' + pathToZip + '"!');
    outputChannel.appendLine('Downloading VHDL_lang release to "' + pathToZip + '"!');

    // Delete old version of zip file
    if (fs.existsSync(pathToZip)) {
        fs.rmSync(pathToZip);
    }

    // Request file from server
    const response = await fetch(downloadUrl + fileName);

    console.log('Got ' + response.status + ' while fetching for VHDL_lang!');
    outputChannel.appendLine('Got ' + response.status + ' while fetching for VHDL_lang!');

    // Check request was successful
    if (response.status !== 200) {
        vscode.window.showErrorMessage('Error while downloading VHDL_lang! Try again later!');
        console.error('Error while downloading VHDL_lang! Try again later!');
        outputChannel.appendLine('Error while downloading VHDL_lang! Try again later!');
        return;
    }

    // Write file to fs
    const fileStream = fs.createWriteStream(pathToZip);
    await pipeline(response.body!, fileStream);

    // Delete old unpacked folder
    if (fs.existsSync(pathToZip.replace('.zip', ''))) {
        fs.rmSync(pathToZip.replace('.zip', ''), { recursive: true });
    }

    const extractTargetDir = pathToZip.replace('.zip', '_extracted');

    console.log('Extracting VHDL_lang to "' + extractTargetDir + '"!');
    outputChannel.appendLine('Extracting VHDL_lang to "' + extractTargetDir + '"!');

    // Unpack downloaded zip
    await extract(pathToZip, { dir: extractTargetDir });

    // Removed now unused zip file
    fs.rmSync(pathToZip);

    // Generate paths for VHDL_lang binary
    const pathToBin = path.join(extractTargetDir, fileName.replace('.zip', ''), '/bin/', binaryName);
    const targetBinPath = path.join(context.extensionPath, 'res', binaryName);

    console.log('Copying binary from "' + pathToBin + '" to "' + targetBinPath + '"!');
    outputChannel.appendLine('Copying binary from "' + pathToBin + '" to "' + targetBinPath + '"!');

    // Copy binary and remove no longer used unpacked folder
    fs.cpSync(pathToBin, targetBinPath);
    fs.rmSync(extractTargetDir, { recursive: true });

    vscode.window.showInformationMessage('Finished downloading VHDL_lang!');
    console.log('Finished downloading VHDL_lang!');
    outputChannel.appendLine('Finished downloading VHDL_lang!');
}

/**
 * @brief Checks the local and remote version of vhdl_lang and updates binary is needed
 * 
 * @param context The context form where the function was ran
 */
export async function checkDownloadVhdlLang(context: vscode.ExtensionContext): Promise<void> {
    if (!checkForVhdlLang(context)) {
        // Download vhdl_lang version
        getVhdlLangExecutable(context);
        return;
    }

    // Get local and remote version numbers
    const localVersion: string = getVhdlLangVersion(context);
    const remoteVersion: string | null = await getLatestReleaseFromGithub();

    // Check if vhdl_lang version matched with remote version
    if (localVersion === remoteVersion) { return; }

    // Download new vhdl_lang version
    getVhdlLangExecutable(context);
}