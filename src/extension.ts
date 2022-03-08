// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const insertCompletedAt = (editBuilder: vscode.TextEditorEdit, currentLine: number) => {
  const d = new Date();
  const completedAt = `CLOSED: [${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}]`
  editBuilder.insert(new vscode.Position(currentLine + 1, 0), `${completedAt}\n`);
};

const deleteCompletedAt = (editor: vscode.TextEditor, editBuilder: vscode.TextEditorEdit, currentLine: number) => {
  let lineText = editor.document.lineAt(currentLine + 1).text;
  if (lineText.match(/^\s*CLOSED: \[\d\d\d\d-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2}\]\s*$/)) {
    editBuilder.delete(new vscode.Range(new vscode.Position(currentLine + 1, 0), new vscode.Position(currentLine + 2, 0)));
  }
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "markdown-todos" is now active!');

  let increaseTodo = vscode.commands.registerCommand('markdown-todos.increaseTodo', async () => {
    const editor = vscode.window.activeTextEditor as vscode.TextEditor;

    let lineIndex = editor.selection.active.line;
    let lineText = editor.document.lineAt(lineIndex).text;

    // Return if it's not a header
    if (!lineText.match(/^\s*#/)) { return; }

    const match = /(^\s*)([#]+)(\s*)([^ ]*)/.exec(lineText);
    if (!match) { return; }
    const [leading, octos, trailing, firstWord] = match.slice(1);
    return await editor.edit((editBuilder) => {
      const startPos = (leading + octos + trailing).length;
      const endPos = (leading + octos + trailing + firstWord).length + 1;
      const replaceRange = new vscode.Range(new vscode.Position(lineIndex, startPos), new vscode.Position(lineIndex, endPos));
      switch (firstWord) {
        case 'TODO':
          editBuilder.replace(replaceRange, 'DONE ');
          insertCompletedAt(editBuilder, lineIndex);
          break;
        case 'DONE':
          editBuilder.replace(replaceRange, '');
          deleteCompletedAt(editor, editBuilder, lineIndex);
          break;
        default:
          editBuilder.insert(new vscode.Position(lineIndex, startPos), 'TODO ');
          deleteCompletedAt(editor, editBuilder, lineIndex);
      }
    });
  });

  context.subscriptions.push(increaseTodo);

  let decreaseTodo = vscode.commands.registerCommand('markdown-todos.decreaseTodo', async () => {
    const editor = vscode.window.activeTextEditor as vscode.TextEditor;

    let lineIndex = editor.selection.active.line;
    let lineText = editor.document.lineAt(lineIndex).text;

    // Return if it's not a header
    if (!lineText.match(/^\s*#/)) { return; }

    const match = /(^\s*)([#]+)(\s*)([^ ]*)/.exec(lineText);
    if (!match) { return; }
    const [leading, octos, trailing, firstWord] = match.slice(1);
    return await editor.edit((editBuilder) => {
      const startPos = (leading + octos + trailing).length;
      const endPos = (leading + octos + trailing + firstWord).length + 1;
      const replaceRange = new vscode.Range(new vscode.Position(lineIndex, startPos), new vscode.Position(lineIndex, endPos));
      switch (firstWord) {
        case 'TODO':
          editBuilder.replace(replaceRange, '');
          deleteCompletedAt(editor, editBuilder, lineIndex);
          break;
        case 'DONE':
          editBuilder.replace(replaceRange, 'TODO ');
          deleteCompletedAt(editor, editBuilder, lineIndex);
          break;
        default:
          editBuilder.insert(new vscode.Position(lineIndex, startPos), 'DONE ');
          insertCompletedAt(editBuilder, lineIndex);
      }
    });
  });

  context.subscriptions.push(decreaseTodo);

  let openCurrentWorklog = vscode.commands.registerCommand('markdown-todos.openCurrentWorklog', async () => {
    const worklogDir = "/Users/scott/Dropbox/work-logs";
    const entries = await fs.promises.readdir(worklogDir);
    const workLogs = entries.filter(entry => entry.match(/\d\d\d\d-\d\d-\d\d\.md/));
    const currentLog = workLogs.sort()[0];
    let uri = vscode.Uri.file(path.join(worklogDir, currentLog));
    await vscode.commands.executeCommand('vscode.open', uri);
    vscode.commands.executeCommand('editor.foldAll');
  });

  context.subscriptions.push(openCurrentWorklog);
}

// this method is called when your extension is deactivated
export function deactivate() { }
