import * as vscode from 'vscode';

const STUTTER_MODE_MAPPINGS = [ ',', '.', ':' ];

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
            // Check if change could be relevant to stutter mode
            if(!STUTTER_MODE_MAPPINGS.includes(change.text))
            {
                continue;
            }

            const position = change.range.start;

            if (position.character < 1) {
                continue;
            }

            // Get character right before relevant changed character
            const prevChar = document.getText(new vscode.Range(
                new vscode.Position(
                    position.line, 
                    position.character - 1
                ),
                position
            ));

            // Check if characters match
            if(change.text !== prevChar) {
                continue;
            }

            let replaceSequence: string = '';

            switch(change.text)
            {
                case ',':
                    replaceSequence = '<=';
                    break;

                case '.':
                    replaceSequence = '=>';
                    break;

                case ':':
                    replaceSequence = ':=';
                    break;

                // Should be impossible to reach
                default:
                    continue;

            }

            const editor = vscode.window.activeTextEditor;

            if (editor && editor.document === document) {
                await editor.edit(editBuilder => {
                    const replaceRange = new vscode.Range(
                        new vscode.Position(position.line, position.character - 1),
                        new vscode.Position(position.line, position.character + 1)
                    );
                    editBuilder.replace(replaceRange, replaceSequence);
                });
            }
        }
    });
}
