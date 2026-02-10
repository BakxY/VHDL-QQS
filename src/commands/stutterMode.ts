import * as vscode from 'vscode';

import { outputChannel } from '../extension';

/**
 * @brief Setup function for stutter mode - emacs-like shortcuts
 * Replaces ,, with <= and .. with =>
 * @author VHDL-QQS
 */
export function getCommand(): vscode.Disposable {
    return setupStutterModeKeybindings();
}

/**
 * @brief Registers keybindings for stutter mode
 * This listens for text document changes and replaces ,, with <= and .. with =>
 */
function setupStutterModeKeybindings(): vscode.Disposable {
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
