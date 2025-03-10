# VHDL-QQS (VHDL-Quartus Questa Simulate)

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE) [![Visual Studio Marketplace Version](https://img.shields.io/vscode-marketplace/v/BakxY.vhdl-qqs)](https://marketplace.visualstudio.com/items?itemName=BakxY.vhdl-qqs) [![GitHub Issues](https://img.shields.io/github/issues/BakxY/VHDL-QQS)](https://img.shields.io/github/issues/BakxY/VHDL-QQS)

This project enhances FPGA design workflows within VS Code by providing a suite of tools for Intel Quartus projects. Features include seamless project compilation, direct access to the Quartus programmer and RTL viewer, automated testbench generation for QuestaSim, integrated QuestaSim simulation capabilities, streamlined project configuration, direct file management, top-level entity changes, and on-demand source file formatting. This extension minimizes manual effort and accelerates the development and verification process.

![Project Banner](./docs/banner.png#center)

## Table of Contents

- [Introduction](#Introduction)
- [Features](#Features)
- [Installation](#Installation)
- [Initial setup](#Initial-setup)
- [Project setup](#Project-setup)
- [Usage](USAGE.md)
- [Contributing](CONTRIBUTING.md)
- [License](LICENSE)

## Introduction

Working with Intel FPGAs using the Quartus development environment can be a real hassle.  Quartus lacks several key features that modern developers expect, making the development process more tedious than it needs to be.  It doesn't offer any code completion, which slows down coding and increases the risk of errors.  The absence of a code formatter makes it difficult to maintain a consistent and readable codebase, especially in larger projects. And perhaps most importantly, for those late-night debugging sessions, Quartus lacks a dark mode—a feature many consider essential for comfortable work.

During my studies, I took a course on FPGAs that heavily relied on Intel Quartus.  After struggling with the software suite for a semester, I reached my breaking point.  I realized there had to be a better way, so I began developing this extension.  My goal was to create a tool that would allow students (and anyone working with Intel FPGAs) to compile, program, and generate testbenches for use in QuestaSim, all without having to use Quartus as their primary text editor.  This extension aims to streamline the FPGA development workflow and provide a more modern and user-friendly experience.  It addresses the shortcomings of Quartus by offering a more feature-rich environment.  Take a look at the features section later in this documentation to see how this extension can improve your FPGA development process.

## Features

* **Seamless Quartus Project Compilation:** Compile your Quartus projects directly within VS Code, eliminating the need to switch between applications.
* **Project Configuration within VS Code:** Manage essential project settings, such as top-level entities and include files, directly from VS Code, streamlining the configuration process.
* **Direct Access to Quartus Programmer:** Easily open the Quartus programmer for compiled projects directly from VS Code, simplifying the programming workflow.
* **Automated Testbench Generation:** Generate entity testbenches for use with QuestaSim, automating a crucial step in the verification process and saving valuable development time.
* **QuestaSim Integration (Optional):** Enable QuestaSim features to run simulations directly from VS Code. This includes running your QuestaSim test scripts and viewing the results. *(Requires configuration - see "Initial Setup")*
* **Direct Access to Quartus RTL Viewer:** Open the RTL Viewer for the active project directly from VS Code to easily view your design's RTL representation.
* **Manage Project Files:** Add and remove files from your project through VS Code, keeping your project files organized.
* **Change Top Level Entity:** Easily change the top-level entity for your Quartus project directly from VS Code.
* **Formatting Source Files:** Effortlessly format your VHDL code, maintaining a clean and consistent codebase.

## Installation

This extension requires VS Code, Quartus Prime and Questa Prime. It can be installed directly from the VS Code Marketplace or build the extension from source. It is also recommended that you use the [VHDL LS](https://github.com/VHDL-LS/rust_hdl_vscode) extension for code completion and language support.

### Installation via VS Code Marketplace (Recommended):
1. Open VS Code.
2. Go to the Extensions view.
3. Search for "VHDL-QQS".
4. Click the Install button.

### Build the extension from source:
1. Prerequisites: Ensure you have Node.js and npm.
2. Clone the repository: `git clone https://github.com/BakxY/VHDL-QQS.git`
3. Open the project in VS Code.
4. Open the terminal in VS Code (View > Terminal).
5. Run `npm install` to install the project dependencies.
6. Press F5 to compile and run the extension in debug mode. This will open a new VS Code window with your extension running.

## Initial setup

Before you can start using the VHDL-QQS extension, you'll need to perform a few initial setup steps. This ensures that the extension can correctly interact with your Quartus and, optionally, your QuestaSim installations.

### 1. Configuring VHDL-QQS Settings

The VHDL-QQS extension's behavior can be customized through VS Code settings.

* Open VS Code settings:
    * File > Preferences > Settings (or Code > Preferences > Settings on macOS)
    * Alternatively, use the keyboard shortcut: Ctrl + , (or Cmd + , on macOS)

* Search for "VHDL-QQS" in the settings search bar. This will filter the settings to show only those related to the extension.

* Configure the following settings as needed:

#### 1.1 General Settings

* `vhdl-qqs.tomlPath`: (Optional) The name of the TOML file used for project configuration. The default is `vhdl_ls.toml`. If you are using a different filename, change this setting.

#### 1.2 Quartus Settings

* `vhdl-qqs.quartusBinPath`: (Required) Enter the *full path* to your Quartus installation's `bin` (or `bin64` on Windows) directory. This is usually the directory where `quartus` and `quartus_sh` is located.  [Example: `/path/to/intelFPGA_lite/23.1/quartus/bin` or `C:\intelFPGA_lite\23.1\quartus\bin64`]

#### 1.3 QuestaSim Settings

* `vhdl-qqs.questaFeatureFlag`: (Optional, but recommended if using QuestaSim) Set this to `true` to enable QuestaSim features within the extension.

* `vhdl-qqs.questaBinPath`: (Required if `vhdl-qqs.questaFeatureFlag` is true) Enter the *full path* to your QuestaSim installation's `win64` (or equivalent for your OS) directory. This is where `vsim` is located. [Example: `C:\Program Files\intelFPGA_pro\24.2\questa_fse\win64`]

* `vhdl-qqs.questaTestsPath`: (Required if `vhdl-qqs.questaFeatureFlag` is true) Enter the *relative path* from your Questa project file (`.mpf`) to the do file that runs all the simulations. This path is used to locate the test files.  [Example: `..\compile.do`]

#### 1.4 Important Notes about Paths

* Make sure to enter the *full paths* to the directories or executables for Quartus and QuestaSim (if applicable). Relative paths are not supported for these settings.
* If you are not using QuestaSim, you can leave the `vhdl-qqs.questaFeatureFlag`, `vhdl-qqs.questaBinPath`, and `vhdl-qqs.questaTestsPath` settings at their default values.

## Project Setup

The VHDL-QQS extension relies on a `vhdl_ls.toml` file to correctly identify and manage your VHDL/Verilog project files. This file defines the project structure, including source files, include paths, and other relevant settings. **Without a properly configured `vhdl_ls.toml` file, the extension may not function correctly.**

Here's how to set up your project:

1.  **Create `vhdl_ls.toml`:** In the root directory of your VHDL/Verilog project, create a file named `vhdl_ls.toml`.  This file *must* be in the root of your project, not in a subdirectory.

2.  **Configure the File:** Edit the `vhdl_ls.toml` file to reflect your project's structure. A basic example is shown below, but you'll need to adapt it to your specific project:

    ```toml
    [library]
    name = "MyProject"  # Replace with your project name

    lib.files = [
        "source\\this_one_file.vhd", # You can specify one or multiple files.
        "source\\*.vhd" # Or you can use wildcard paths to include all files.
    ]
    ```

3.  **Save the File:** Save the `vhdl_ls.toml` file.

**Example Project Structure:**

```
MyProject/
├── vhdl_ls.toml
├── quartus/
│   ├── MyProject.qpf
│   └── MyProject.qsf
└── source/
    ├── top_level.vhd
    └── submodule.vhd
```

**Troubleshooting:**

*   If the extension is not recognizing your files, double-check the paths in your `vhdl_ls.toml` file.  Make sure they are relative to the directory where the `vhdl_ls.toml` file is located.