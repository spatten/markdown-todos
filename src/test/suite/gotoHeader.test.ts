import * as assert from 'assert';
import * as vscode from 'vscode';
import * as helpers from '../helpers';

describe('goto header functions', async function () {
  let editor: vscode.TextEditor;
  before(async function () {
    editor = await helpers.openExample('simple.md', { lineNumber: 23 });
  });

  describe('gotoPreviousHeader', async () => {
    it('should go to the previous header', async () => {
      helpers.gotoLine(editor, 23);
      await vscode.commands.executeCommand("markdown-worklogs.gotoPreviousHeader");
      const position = editor.selection.active;
      assert.strictEqual(20, position.line);
    });

    it('should go to the previous header even if you are on a header', async () => {
      helpers.gotoLine(editor, 2);
      await vscode.commands.executeCommand("markdown-worklogs.gotoPreviousHeader");
      const position = editor.selection.active;
      assert.strictEqual(0, position.line);
    });

    it('should ignore "# " in a code block', async () => {
      helpers.gotoLine(editor, 17);
      await vscode.commands.executeCommand("markdown-worklogs.gotoPreviousHeader");
      const position = editor.selection.active;
      assert.strictEqual(8, position.line);
    });
  });

  describe('gotoPreviousTopLevelHeader', async () => {
    it('should go to the previous top-level header', async () => {
      helpers.gotoLine(editor, 10);
      await vscode.commands.executeCommand("markdown-worklogs.gotoPreviousTopLevelHeader");
      const position = editor.selection.active;
      assert.strictEqual(0, position.line);
    });
  });

  describe('gotoNextHeader', async () => {
    it('should go to the next header', async () => {
      helpers.gotoLine(editor, 22);
      await vscode.commands.executeCommand("markdown-worklogs.gotoNextHeader");
      const position = editor.selection.active;
      assert.strictEqual(25, position.line);
    });

    it('should ignore "# " in a code block', async () => {
      // editor = await helpers.openExample('simple.md', { lineNumber: 23 });
      helpers.gotoLine(editor, 10);
      await vscode.commands.executeCommand("markdown-worklogs.gotoNextHeader");
      const position = editor.selection.active;
      assert.strictEqual(19, position.line);
    });
  });

  describe('gotoNextTopLevelHeader', async () => {
    it('should go to the next top-level header', async () => {
      helpers.gotoLine(editor, 0);
      await vscode.commands.executeCommand("markdown-worklogs.gotoNextTopLevelHeader");
      const position = editor.selection.active;
      assert.strictEqual(19, position.line);
    });
  });
});
