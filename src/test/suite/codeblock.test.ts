
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as helpers from '../helpers';

describe('codeblock functions', function () {
  let editor: vscode.TextEditor;

  beforeEach(async function () {
    editor = await helpers.openExample('codeBlock.md');
  });

  afterEach(async function () {
    // we need to close the document so it gets reloaded fresh from the fixture for each test
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  });

  describe('selectCurrentCodeblock', function () {
    it('should select the contents if you are in the codeblock', async function () {
      // put your cursor in the codeblock
      helpers.gotoLine(editor, 4);
      await vscode.commands.executeCommand("markdown-worklogs.selectCurrentCodeblock");

      const s = editor.selection.start;
      const e = editor.selection.end;
      assert.strictEqual(JSON.stringify(s), '{"line":3,"character":0}');
      assert.strictEqual(JSON.stringify(e), '{"line":5,"character":3}');
    });

    it('should do nothing if you are not in a codeblock', async function () {
      // there is no codeblock on the first line
      helpers.gotoLine(editor, 0);
      await vscode.commands.executeCommand("markdown-worklogs.selectCurrentCodeblock");

      const s = editor.selection.start;
      const e = editor.selection.end;
      assert.strictEqual(JSON.stringify(s), '{"line":0,"character":0}');
      assert.strictEqual(JSON.stringify(e), '{"line":0,"character":0}');
    });
  });

  describe('copyCurrentCodeblock', function () {
    it('should copy the contents into the clipboard if you are in the codeblock', async function () {
      // put your cursor in the codeblock
      helpers.gotoLine(editor, 4);
      await vscode.commands.executeCommand("markdown-worklogs.copyCurrentCodeblock");

      const expectedText = 'def foo\n  "foo"\nend\n';
      const clipboardText = await vscode.env.clipboard.readText();
      assert.strictEqual(clipboardText, expectedText);
    });

    it('should leave the existing clipboard if you are not in the codeblock', async function () {
      // There is no codeblock in the first line
      helpers.gotoLine(editor, 0);
      const expectedText = 'foo';
      await vscode.env.clipboard.writeText(expectedText);
      await vscode.commands.executeCommand("markdown-worklogs.copyCurrentCodeblock");

      const clipboardText = await vscode.env.clipboard.readText();
      assert.strictEqual(clipboardText, expectedText);
    });
  });
});
