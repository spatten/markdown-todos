// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const TODO_TYPES = ["", "TODO", "DONE"];
const insertCompletedAt = (editBuilder: vscode.TextEditorEdit, currentLine: number, indent: number) => {
  const d = new Date();
  const padding = ' '.repeat(indent);
  const completedAt = `${padding}CLOSED: [${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${d.getMinutes()}]`;
  editBuilder.insert(new vscode.Position(currentLine + 1, 0), `${completedAt}\n`);
};

const deleteCompletedAt = (editor: vscode.TextEditor, editBuilder: vscode.TextEditorEdit, currentLine: number) => {
  let lineText = editor.document.lineAt(currentLine + 1).text;
  if (lineText.match(/^\s*CLOSED: \[\d\d\d\d-\d{1,2}-\d{1,2} \d{1,2}:\d{1,2}\]\s*$/)) {
    editBuilder.delete(new vscode.Range(new vscode.Position(currentLine + 1, 0), new vscode.Position(currentLine + 2, 0)));
  }
};

const findHeader = (direction: 1 | -1): number => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { throw new Error("no active editor"); }

  let lineIndex = editor.selection.active.line;
  const lastLine = editor.document.lineCount;
  while (lineIndex >= 0 && lineIndex < lastLine) {
    let lineText = editor.document.lineAt(lineIndex).text;
    if (headerLevelForLine(lineText) > 0) {
      return lineIndex;
    }
    lineIndex += direction;
  }
  return -1;
};

const findPreviousHeader = () => findHeader(-1);
const findNextHeader = () => findHeader(1);

const headerLevelForLine = (lineText: string): number => {
  // Return if it's not a header
  const matches = lineText.match(/^\s*(#+)/);
  if (!matches) {
    return 0;
  }
  return matches[1].length;
};

let gotoHeader = (direction: 1 | -1) => {
  const headerLine = findHeader(direction);

  if (headerLine > 0) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) { throw new Error("no active editor"); }
    const position = editor.selection.active;
    var newPosition = position.with(headerLine, 0);
    var newSelection = new vscode.Selection(newPosition, newPosition);
    editor.selection = newSelection;
    var range = new vscode.Range(newPosition, newPosition);
    editor.revealRange(range, vscode.TextEditorRevealType.Default);
  }
};

const changeTodo = async (change: -1 | 1) => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { throw new Error("no active editor"); }

  let lineIndex = findPreviousHeader();
  if (lineIndex < 0) {
    return;
  }
  let lineText = editor.document.lineAt(lineIndex).text;

  // match (leading space)(#-signs)(space after #-signs)(first word)
  const match = /^(\s*)([#]+)(\s*)([^ ]*)/.exec(lineText);
  if (!match) { return; }
  const [leading, octos, trailing, firstWord] = match.slice(1);

  // If firstWord is not 'TODO' or 'DONE', then it's '', the first entry in TODO_TYPES
  let currentIndex = TODO_TYPES.indexOf(firstWord);
  if (currentIndex === -1) {
    currentIndex = 0;
  }

  // find the next TODO word, looping around in either direction
  let nextIndex = currentIndex + change;
  if (nextIndex >= TODO_TYPES.length) {
    nextIndex = 0;
  }
  if (nextIndex < 0) {
    nextIndex = TODO_TYPES.length - 1;
  }

  // We need to insert an extra space if nextWord is not ''
  let nextWord = TODO_TYPES[nextIndex];
  if (nextWord !== '') {
    nextWord = nextWord + ' ';
  }

  return await editor.edit((editBuilder) => {
    const startPos = (leading + octos + trailing).length;
    const endPos = startPos + firstWord.length + 1;
    const replaceRange = new vscode.Range(new vscode.Position(lineIndex, startPos), new vscode.Position(lineIndex, endPos));

    // if the firsst word of the header is not TODO or DONE, then we want to insert TODO or DONE
    // otherwise we want to replace the current TODO or DONE with nextWord
    if (TODO_TYPES.indexOf(firstWord) < 1) {
      editBuilder.insert(new vscode.Position(lineIndex, startPos), nextWord);
    } else {
      editBuilder.replace(replaceRange, nextWord);
    }

    // add or delete the completedAt text
    if (nextWord === 'DONE ') {
      insertCompletedAt(editBuilder, lineIndex, leading.length + octos.length + 1);
    } else {
      deleteCompletedAt(editor, editBuilder, lineIndex);
    }
  });
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "markdown-todos" is now active!');

  let increaseTodo = vscode.commands.registerCommand('markdown-todos.increaseTodo', async () => {
    await changeTodo(1);
  });
  context.subscriptions.push(increaseTodo);

  let decreaseTodo = vscode.commands.registerCommand('markdown-todos.decreaseTodo', async () => {
    await changeTodo(-1);
  });
  context.subscriptions.push(decreaseTodo);

  let openCurrentWorklog = vscode.commands.registerCommand('markdown-todos.openCurrentWorklog', async () => {
    const worklogDir = "/Users/scott/Dropbox/work-logs";
    const entries = await fs.promises.readdir(worklogDir);
    const workLogs = entries.filter(entry => entry.match(/^\d\d\d\d-\d\d-\d\d\.md$/));
    const currentLog = workLogs.sort().reverse()[0];
    let uri = vscode.Uri.file(path.join(worklogDir, currentLog));
    await vscode.commands.executeCommand('vscode.open', uri);
    vscode.commands.executeCommand('editor.foldAll');
    vscode.commands.executeCommand('workbench.action.pinEditor');
  });
  context.subscriptions.push(openCurrentWorklog);

  let gotoPreviousHeader = vscode.commands.registerCommand('markdown-todos.gotoPreviousHeader', async () => {
    gotoHeader(-1);
  });
  context.subscriptions.push(gotoPreviousHeader);

  let gotoNextHeader = vscode.commands.registerCommand('markdown-todos.gotoNextHeader', async () => {
    gotoHeader(1);
  });
  context.subscriptions.push(gotoNextHeader);
}

// this method is called when your extension is deactivated
export function deactivate() { }
