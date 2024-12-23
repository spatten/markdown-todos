import * as assert from 'assert';
import * as vscode from 'vscode';
import * as helpers from '../helpers';

describe('goto header functions', function () {
  let editor: vscode.TextEditor;

  before(async function () {
    editor = await helpers.openExample('simple.md', { lineNumber: 23 });
  });

  describe('gotoPreviousHeader', function () {
    it('should go to the previous header', async function () {
      helpers.gotoLine(editor, 23);
      await vscode.commands.executeCommand("markdown-worklogs.gotoPreviousHeader");
      const position = editor.selection.active;
      assert.strictEqual(position.line, 21);
    });

    it('should go to the previous header even if you are on a header', async function () {
      helpers.gotoLine(editor, 2);
      await vscode.commands.executeCommand("markdown-worklogs.gotoPreviousHeader");
      const position = editor.selection.active;
      assert.strictEqual(position.line, 0);
    });

    it('should ignore "# " in a code block', async function () {
      helpers.gotoLine(editor, 17);
      await vscode.commands.executeCommand("markdown-worklogs.gotoPreviousHeader");
      const position = editor.selection.active;
      assert.strictEqual(position.line, 8);
    });
  });

  describe('gotoPreviousTopLevelHeader', function () {
    it('should go to the previous top-level header', async function () {
      helpers.gotoLine(editor, 10);
      await vscode.commands.executeCommand("markdown-worklogs.gotoPreviousTopLevelHeader");
      const position = editor.selection.active;
      assert.strictEqual(position.line, 0);
    });
  });

  describe('gotoNextHeader', function () {
    it('should go to the next header', async function () {
      helpers.gotoLine(editor, 22);
      await vscode.commands.executeCommand("markdown-worklogs.gotoNextHeader");
      const position = editor.selection.active;
      assert.strictEqual(position.line, 25);
    });

    it('should ignore "# " in a code block', async function () {
      // editor = await helpers.openExample('simple.md', { lineNumber: 23 });
      helpers.gotoLine(editor, 10);
      await vscode.commands.executeCommand("markdown-worklogs.gotoNextHeader");
      const position = editor.selection.active;
      assert.strictEqual(position.line, 19);
    });
  });

  describe('gotoNextTopLevelHeader', function () {
    it('should go to the next top-level header', async function () {
      helpers.gotoLine(editor, 0);
      await vscode.commands.executeCommand("markdown-worklogs.gotoNextTopLevelHeader");
      const position = editor.selection.active;
      assert.strictEqual(position.line, 19);
    });
  });
});
