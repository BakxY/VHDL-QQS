import * as vscode from 'vscode';

/**
 * @brief Registers keybindings for stutter mode (emacs-like shortcuts).
 * 
 * @details This listens for text document changes and replaces `,,` with `<=` and `..` with `=>`.
 * 
 * @author dwildmann
 * 
 * @todo Move feature flag check to setup function.
 * @todo Implement support for enable/disable stutter mode without restart.
 */
export function setupStutterMode(): vscode.Disposable {
    return vscode.workspace.onDidChangeTextDocument(async (event) => {
        const document = event.document;

        if (document.languageId !== 'vhdl') {
            return;
        }

        for (const change of event.contentChanges) {
            if (change.text === ',') {
                const position = change.range.start;
                if (position.character >= 1) {
                    const prevChar = document.getText(new vscode.Range(
                        new vscode.Position(position.line, position.character - 1),
                        position
                    ));

                    if (prevChar === ',') {
                        const editor = vscode.window.activeTextEditor;
                        if (editor && editor.document === document) {
                            await editor.edit(editBuilder => {
                                const replaceRange = new vscode.Range(
                                    new vscode.Position(position.line, position.character - 1),
                                    new vscode.Position(position.line, position.character + 1)
                                );
                                editBuilder.replace(replaceRange, '<=');
                            });
                        }
                    }
                }
            } else if (change.text === '.') {
                const position = change.range.start;
                if (position.character >= 1) {
                    const prevChar = document.getText(new vscode.Range(
                        new vscode.Position(position.line, position.character - 1),
                        position
                    ));

                    if (prevChar === '.') {
                        const editor = vscode.window.activeTextEditor;
                        if (editor && editor.document === document) {
                            await editor.edit(editBuilder => {
                                const replaceRange = new vscode.Range(
                                    new vscode.Position(position.line, position.character - 1),
                                    new vscode.Position(position.line, position.character + 1)
                                );
                                editBuilder.replace(replaceRange, '=>');
                            });
                        }
                    }
                }
            } else if (change.text === ':') {
                const position = change.range.start;
                if (position.character >= 1) {
                    const prevChar = document.getText(new vscode.Range(
                        new vscode.Position(position.line, position.character - 1),
                        position
                    ));

                    if (prevChar === ':') {
                        const editor = vscode.window.activeTextEditor;
                        if (editor && editor.document === document) {
                            await editor.edit(editBuilder => {
                                const replaceRange = new vscode.Range(
                                    new vscode.Position(position.line, position.character - 1),
                                    new vscode.Position(position.line, position.character + 1)
                                );
                                editBuilder.replace(replaceRange, ':=');
                            });
                        }
                    }
                }
            }
        }
    });
}
