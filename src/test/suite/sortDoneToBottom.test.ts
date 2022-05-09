import * as fs from 'fs';
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as helpers from '../helpers';


describe('sortDoneToBottom', async function () {
  it('should sort the DONEs in sortable.md to the bottom', async function () {
    const editor = await helpers.openExample('sortable.md');
    await vscode.commands.executeCommand('markdown-worklogs.sortDoneToBottom');
    await helpers.sleep(100);
    const fullText = editor.document.getText();
    const expectedSortedTextBuffer = await fs.promises.readFile(helpers.fixturePath('sortable-sorted.md'));
    const expectedSortedText = expectedSortedTextBuffer.toString();
    assert.strictEqual(fullText, expectedSortedText);
  });
  it('should sort the DONEs in another-sortable.md to the bottom', async function () {
    const editor = await helpers.openExample('another-sortable.md');
    await vscode.commands.executeCommand('markdown-worklogs.sortDoneToBottom');
    await helpers.sleep(100);
    const fullText = editor.document.getText();
    const expectedSortedTextBuffer = await fs.promises.readFile(helpers.fixturePath('another-sortable-sorted.md'));
    const expectedSortedText = expectedSortedTextBuffer.toString();
    assert.strictEqual(fullText, expectedSortedText);
  });
});
