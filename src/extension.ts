// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const TODO_TYPES = ["", "TODO", "DONE"];

type HeaderInfo = {
  leadingSpace: number;
  level: number;
  trailingSpace: number;
  todoState: string;
  todoIndex: number;
};

const emptyHeader: HeaderInfo = {
  leadingSpace: 0,
  level: 0,
  trailingSpace: 0,
  todoState: '',
  todoIndex: 0
};

const getHeaderInfo = (lineText: string): HeaderInfo => {
  // match (leading space)(#-signs)(space after #-signs)(first word)
  const match = /^(\s*)([#]+)(\s*)([^ ]*)/.exec(lineText);
  if (!match) { return emptyHeader; }
  const [leading, octos, trailing, firstWord] = match.slice(1);

  let currentIndex = TODO_TYPES.indexOf(firstWord);
  // If firstWord is not 'TODO' or 'DONE', then it's '', the first entry in TODO_TYPES
  if (currentIndex === -1) {
    currentIndex = 0;
  }
  return {
    leadingSpace: leading.length,
    level: octos.length,
    trailingSpace: trailing.length,
    todoIndex: currentIndex,
    todoState: TODO_TYPES[currentIndex],
  };
};

// insert "  CLOSED: yyyy-mm-dd hh:m" after the DONEq header
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

const findHeader = (direction: 1 | -1, ignoreCurrent: boolean = false): number => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { throw new Error("no active editor"); }

  let lineIndex = editor.selection.active.line;
  if (ignoreCurrent) {
    lineIndex += direction;
  }
  const lastLine = editor.document.lineCount;
  while (lineIndex >= 0 && lineIndex < lastLine) {
    let lineText = editor.document.lineAt(lineIndex).text;
    if (getHeaderInfo(lineText).level > 0) {
      return lineIndex;
    }
    lineIndex += direction;
  }
  return -1;
};

let gotoHeader = (direction: 1 | -1) => {
  const headerLine = findHeader(direction, true);

  if (headerLine >= 0) {
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

  let lineIndex = findHeader(-1, false);
  if (lineIndex < 0) {
    return;
  }
  let lineText = editor.document.lineAt(lineIndex).text;
  const { leadingSpace, level, trailingSpace, todoState: currentState, todoIndex: currentIndex } = getHeaderInfo(lineText);

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
    const startPos = leadingSpace + level + trailingSpace;
    // const startPos = (leading + octos + trailing).length;
    const endPos = startPos + currentState.length + 1;
    // const endPos = startPos + firstWord.length + 1;
    const replaceRange = new vscode.Range(new vscode.Position(lineIndex, startPos), new vscode.Position(lineIndex, endPos));

    // if the firsst word of the header is not TODO or DONE, then we want to insert TODO or DONE
    // otherwise we want to replace the current TODO or DONE with nextWord
    if (currentIndex < 1) {
      editBuilder.insert(new vscode.Position(lineIndex, startPos), nextWord);
    } else {
      editBuilder.replace(replaceRange, nextWord);
    }

    // add or delete the completedAt text
    if (nextWord === 'DONE ') {
      insertCompletedAt(editBuilder, lineIndex, leadingSpace + level + 1);
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
  console.log('Congratulations, your extension "markdown-worklogs" is now active!');

  let increaseTodo = vscode.commands.registerCommand('markdown-worklogs.increaseTodo', async () => {
    await changeTodo(1);
  });
  context.subscriptions.push(increaseTodo);

  let decreaseTodo = vscode.commands.registerCommand('markdown-worklogs.decreaseTodo', async () => {
    await changeTodo(-1);
  });
  context.subscriptions.push(decreaseTodo);

  let openCurrentWorklog = vscode.commands.registerCommand('markdown-worklogs.openCurrentWorklog', async () => {
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

  let gotoPreviousHeader = vscode.commands.registerCommand('markdown-worklogs.gotoPreviousHeader', async () => {
    gotoHeader(-1);
  });
  context.subscriptions.push(gotoPreviousHeader);

  let gotoNextHeader = vscode.commands.registerCommand('markdown-worklogs.gotoNextHeader', async () => {
    gotoHeader(1);
  });
  context.subscriptions.push(gotoNextHeader);
}

// this method is called when your extension is deactivated
export function deactivate() { }
