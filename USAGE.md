## Usage Examples

This section provides practical examples of how to use the VHDL-QQS extension to perform common FPGA development tasks. These examples demonstrate the key features and workflows, helping you get started quickly.

**1. Compiling a Quartus Project:**

This example shows how to compile a Quartus project directly within VS Code.

* **Step 1: Open the Project Folder:** Open your Quartus project folder in VS Code.

* **Step 2: Select Project:** Select a project by clicking 

* **Step 2: Trigger Compilation:** [Describe how to trigger the compilation. For example:]
    *   Open the command palette (Ctrl+Shift+P or Cmd+Shift+P) and type "Compile Quartus Project".
    *   Alternatively, you can use the shortcut key [mention shortcut if any] or click the "Compile" button in the VS Code status bar.

* **Step 3: Observe Compilation Progress:** The compilation progress will be displayed in the VS Code terminal.

* **Step 4: [Optional: Handle Compilation Errors]:** [Explain how to view and handle compilation errors.]

![Compilation GIF](./gifs/compilation.gif)  *(Replace `gifs/compilation.gif` with the actual path to your GIF file.  The `./` indicates it's in the same directory as this README file, in a subfolder called `gifs`)*

**2. Generating a Testbench for QuestaSim:**

This example demonstrates how to generate a testbench for your entity using the extension.

* **Step 1: Open the Entity File:** Open the VHDL or Verilog file for the entity you want to create a testbench for.

* **Step 2: Generate Testbench:** [Describe how to generate the testbench. For example:]
    *   Right-click on the entity declaration in the code editor.
    *   Select "Generate Testbench".
    *   Or use the command palette (Ctrl+Shift+P or Cmd+Shift+P) and type "Generate Testbench".

* **Step 3: [Optional: Customize Testbench]:** [Explain any customization options for the testbench generation.]

* **Step 4: View the Testbench:** The generated testbench file will be opened in the editor.

![Testbench Generation GIF](./gifs/testbench_generation.gif) *(Replace `gifs/testbench_generation.gif` with the actual path to your GIF file)*

**3. [Optional: Programming the FPGA]:**

[Include an example for programming the FPGA if your extension supports it.]

* [Describe the steps involved.]

![FPGA Programming GIF](./gifs/fpga_programming.gif) *(Replace `gifs/fpga_programming.gif` with the actual path to your GIF file)*

**4. [Optional: Managing Project Settings]:**

[Include an example of how to manage project settings within VS Code.]

* [Describe the steps involved.]

![Project Settings GIF](./gifs/project_settings.gif) *(Replace `gifs/project_settings.gif` with the actual path to your GIF file)*

**Important:**

* This file assumes that the GIF files are located in a subfolder named `gifs` within the same directory as this Markdown file.  You can adjust the path in the `<img>` tags if your GIFs are stored elsewhere.  For example:
    *   If the GIFs are in the same directory: `![GIF Name](compilation.gif)`
    *   If the GIFs are in a folder called `assets`: `![GIF Name](assets/compilation.gif)`
    *   If you're hosting the GIFs online: `![GIF Name](https://your-website.com/gifs/compilation.gif)`

* Make sure the GIF files exist at the specified locations.

* Consider using relative paths (like `./gifs/compilation.gif`) for better portability.  Relative paths are relative to the location of the Markdown file itself.