import * as assert from 'assert';
import * as vscode from 'vscode';
import * as helpers from '../helpers';

suite('gotoPreviousHeader', async () => {
  let editor: vscode.TextEditor;
  setup(async function () {
    editor = await helpers.openExample('simple.md', { lineNumber: 23 });
  });

  test('gotoPreviousHeader goes to the previous header', async () => {
    helpers.gotoLine(editor, 23);
    await vscode.commands.executeCommand("markdown-worklogs.gotoPreviousHeader");
    const position = editor.selection.active;
    assert.strictEqual(21, position.line);
  });

  test('gotoPreviousHeader goes to the previous header even if you are on a header', async () => {
    helpers.gotoLine(editor, 2);
    await vscode.commands.executeCommand("markdown-worklogs.gotoPreviousHeader");
    const position = editor.selection.active;
    assert.strictEqual(0, position.line);
  });

  test('gotoPreviousHeader ignores "# " in a code block', async () => {
    helpers.gotoLine(editor, 17);
    await vscode.commands.executeCommand("markdown-worklogs.gotoPreviousHeader");
    const position = editor.selection.active;
    assert.strictEqual(8, position.line);
  });
});

suite('gotoNextHeader', async () => {
  let editor: vscode.TextEditor;
  setup(async function () {
    editor = await helpers.openExample('simple.md');
  });

  test('gotoNextHeader goes to the next header', async () => {
    helpers.gotoLine(editor, 22);
    await vscode.commands.executeCommand("markdown-worklogs.gotoNextHeader");
    const position = editor.selection.active;
    assert.strictEqual(25, position.line);
  });

  test('gotoNextHeader ignores "# " in a code block', async () => {
    // editor = await helpers.openExample('simple.md', { lineNumber: 23 });
    helpers.gotoLine(editor, 10);
    await vscode.commands.executeCommand("markdown-worklogs.gotoNextHeader");
    const position = editor.selection.active;
    assert.strictEqual(19, position.line);
  });
});
