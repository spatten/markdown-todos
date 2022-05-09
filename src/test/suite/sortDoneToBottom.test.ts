import * as fs from 'fs';
import * as path from "path";
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as helpers from '../helpers';


describe('sortDoneToBottom', async function () {
  let editor: vscode.TextEditor;
  let document: vscode.TextDocument;
  before(async function () {
    editor = await helpers.openExample('sortable.md');
  });

  it('should sort the DONEs to the bottom', async function () {
    await vscode.commands.executeCommand('markdown-worklogs.sortDoneToBottom');
    await helpers.sleep(100);
    const fullText = editor.document.getText();
    const expectedSortedText = await fs.promises.readFile(helpers.fixturePath('sortable-sorted.md'));
    console.log(`after sorting:\n${fullText}`);
    assert.strictEqual(fullText, expectedSortedText);
  });
});
