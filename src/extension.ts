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

const findHeader = ({ direction = 1, ignoreCurrent = false, startLine }: { direction: 1 | -1; ignoreCurrent: boolean; startLine?: number }): number => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { throw new Error("no active editor"); }

  let lineIndex;
  if (startLine === undefined) {
    lineIndex = editor.selection.active.line;
  } else {
    lineIndex = startLine;
  }
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

let gotoHeader = (editor: vscode.TextEditor, direction: 1 | -1) => {
  const headerLine = findHeader({ direction, ignoreCurrent: true });

  if (headerLine >= 0) {
    if (!editor) { throw new Error("no active editor"); }
    const position = editor.selection.active;
    var newPosition = new vscode.Position(headerLine, 0);
    var newSelection: vscode.Selection;
    var range: vscode.Range;
    if (editor.selection.isEmpty) {
      console.log(`no previous selection`);
      newSelection = new vscode.Selection(newPosition, newPosition);
      range = new vscode.Range(newPosition, newPosition);
    } else {
      console.log(`expanding selection`);
      newSelection = editor.selection.isReversed ? new vscode.Selection(position, newPosition) : new vscode.Selection(newPosition, position);
      range = editor.selection.isReversed ? editor.selection.with(newPosition) : editor.selection.with(undefined, newPosition);
    }
    editor.selection = newSelection;
    editor.revealRange(range, vscode.TextEditorRevealType.Default);
  }
};

const changeTodo = async (change: -1 | 1) => {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { throw new Error("no active editor"); }

  let lineIndex = findHeader({ direction: -1, ignoreCurrent: false });
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

const moveEntryToBottom = async (editor: vscode.TextEditor, doneEntry: [number, number], lastNonDONELine: number): Promise<number> => {
  let linesMoved = 0;
  const res = await editor.edit((editBuilder) => {
    const replaceRange = new vscode.Range(new vscode.Position(doneEntry[0], 0), new vscode.Position(doneEntry[1] + 1, 0));
    const doneText = editor.document.getText(replaceRange);
    if (doneEntry[0] >= lastNonDONELine) {
      linesMoved = 0;
      return;
    }
    editBuilder.replace(replaceRange, '');
    editBuilder.insert(new vscode.Position(lastNonDONELine + 1, 0), doneText);
    linesMoved = doneEntry[1] - doneEntry[0] + 1;
  });
  return linesMoved;
};

const minHeaderLevelInSelection = (editor: vscode.TextEditor, firstLine: number, lastLine: number): number => {
  let lineIndex = lastLine;
  let minLevel: number = 9999;

  let lineText = editor.document.lineAt(lineIndex).text;
  const { level } = getHeaderInfo(lineText);
  if (level > 0) {
    minLevel = level;
  }

  while (lineIndex >= firstLine) {
    lineIndex = findHeader({ direction: -1, ignoreCurrent: true, startLine: lineIndex });
    console.log(`headerLine = ${lineIndex}`);
    if (lineIndex >= firstLine) {
      let lineText = editor.document.lineAt(lineIndex).text;
      const { level } = getHeaderInfo(lineText);
      if (level > 0 && level < minLevel) {
        minLevel = level;
      }
    }
  }
  if (minLevel === 9999) {
    minLevel = 1;
  }
  return minLevel;
};

// move all top-level DONE sections to the bottom of the file, maintaining their order
const moveAllDoneToBottom = async function () {
  const editor = vscode.window.activeTextEditor;
  if (!editor) { throw new Error("no active editor"); }

  // if there is a selection, then only search in the selection and sort the top-level
  // of headers found in the selection.
  // If there is no selection, then search the whole file and sort level-1 headers
  var firstLine = 0;
  var lastLine = editor.document.lineCount - 1;
  var topHeaderLevel = 1;
  if (editor.selection.start.line !== editor.selection.end.line) {
    console.log(`we have a selection`);
    firstLine = editor.selection.start.line;
    lastLine = editor.selection.end.line;
    topHeaderLevel = minHeaderLevelInSelection(editor, firstLine, lastLine);
    console.log(`firstLine: ${firstLine}, lastLine: ${lastLine}, min header level: ${topHeaderLevel}`);
  }

  // get a list of the line ranges for all top-level DONE entries
  // Also, find the last line that is not part of a DONE entry
  let currentLastLineInDone = lastLine;
  let lastNonDONELine = -1;
  let doneEntries: [number, number][] = [];
  for (let lineIndex = lastLine; lineIndex >= firstLine; lineIndex--) {
    const lineText = editor.document.lineAt(lineIndex).text;
    const headerInfo = getHeaderInfo(lineText);
    if (headerInfo.level !== topHeaderLevel) { // not a top-level header, so just set last line if necessary
      if (currentLastLineInDone === -1) {
        currentLastLineInDone = lineIndex;
      }
    } else if (headerInfo.todoState === 'DONE') { // a DONE header
      // single line DONE case
      if (currentLastLineInDone === -1) {
        currentLastLineInDone = lineIndex;
      }
      doneEntries.push([lineIndex, currentLastLineInDone]);
      currentLastLineInDone = -1;
    } else { // a non-DONE header
      if (lastNonDONELine === -1) {
        lastNonDONELine = currentLastLineInDone === -1 ? lineIndex : currentLastLineInDone;
      }
      currentLastLineInDone = -1;
    }
  }

  // now, start moving the DONE entries down below lastNonDONELine
  for (const doneEntry of doneEntries) {
    const linesMoved = await moveEntryToBottom(editor, doneEntry, lastNonDONELine);
    lastNonDONELine -= linesMoved;
  }
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

  let gotoPreviousHeader = vscode.commands.registerTextEditorCommand('markdown-worklogs.gotoPreviousHeader', async (te) => {
    gotoHeader(te, -1);
  });
  context.subscriptions.push(gotoPreviousHeader);

  let gotoNextHeader = vscode.commands.registerTextEditorCommand('markdown-worklogs.gotoNextHeader', async (te) => {
    gotoHeader(te, 1);
  });
  context.subscriptions.push(gotoNextHeader);

  let sortDoneToBottom = vscode.commands.registerCommand('markdown-worklogs.sortDoneToBottom', async () => {
    moveAllDoneToBottom();
  });
  context.subscriptions.push(sortDoneToBottom);
}

// this method is called when your extension is deactivated
export function deactivate() { }
