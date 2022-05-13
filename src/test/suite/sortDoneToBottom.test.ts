import * as fs from 'fs';
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as helpers from '../helpers';


describe('sorting', function () {
  afterEach(async function () {
    // we need to close the document so it gets reloaded fresh from the fixture for each test
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  });

  describe('sortDoneToBottom', function () {
    it('should sort the DONEs in sortable.md to the bottom', async function () {
      const editor = await helpers.openExample('sortable.md');
      await vscode.commands.executeCommand('markdown-worklogs.sortDoneToBottom');
      await helpers.sleep(300);
      const fullText = editor.document.getText();
      const expectedSortedTextBuffer = await fs.promises.readFile(helpers.fixturePath('sortable-sorted.md'));
      const expectedSortedText = expectedSortedTextBuffer.toString();
      assert.strictEqual(fullText, expectedSortedText);
    });
    it('should sort the DONEs in another-sortable.md to the bottom', async function () {
      const editor = await helpers.openExample('another-sortable.md');
      await vscode.commands.executeCommand('markdown-worklogs.sortDoneToBottom');
      await helpers.sleep(300);
      const fullText = editor.document.getText();
      const expectedSortedTextBuffer = await fs.promises.readFile(helpers.fixturePath('another-sortable-sorted.md'));
      const expectedSortedText = expectedSortedTextBuffer.toString();
      assert.strictEqual(fullText, expectedSortedText);
    });
  });

  describe('sortCurrentDoneToBottom', function () {
    it('should sort the DONEs in the first section of nested-sortable.md to the bottom', async function () {
      const editor = await helpers.openExample('nested-sortable.md');
      helpers.gotoLine(editor, 0);
      await vscode.commands.executeCommand('markdown-worklogs.sortCurrentDoneToBottom');
      await helpers.sleep(300);
      const fullText = editor.document.getText();
      const expectedSortedTextBuffer = await fs.promises.readFile(helpers.fixturePath('nested-sortable-sorted.md'));
      const expectedSortedText = expectedSortedTextBuffer.toString();
      assert.strictEqual(fullText, expectedSortedText);
    });

    it('should sort the DONEs in the second section of nested-sortable.md to the bottom', async function () {
      const editor = await helpers.openExample('nested-sortable.md');
      helpers.gotoLine(editor, 18);
      await vscode.commands.executeCommand('markdown-worklogs.sortCurrentDoneToBottom');
      await helpers.sleep(300);
      const fullText = editor.document.getText();
      const expectedSortedTextBuffer = await fs.promises.readFile(helpers.fixturePath('nested-sortable-sorted-take2.md'));
      const expectedSortedText = expectedSortedTextBuffer.toString();
      assert.strictEqual(fullText, expectedSortedText);
    });
  });
});
