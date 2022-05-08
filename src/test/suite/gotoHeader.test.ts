import * as assert from 'assert';
import * as vscode from 'vscode';
import * as helpers from '../helpers';


suite('gotoHeader', async () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('gotoPreviousHeader goes to the previous header', async () => {
		const editor = await helpers.openExample('simple.md', { lineNumber: 23 });
		await vscode.commands.executeCommand("markdown-worklogs.gotoPreviousHeader");
		const position = editor.selection.active;
		assert.strictEqual(21, position.line);
	});

	test('gotoPreviousHeader ignores "# " in a code block', async () => {
		const editor = await helpers.openExample('simple.md', { lineNumber: 17 });
		await vscode.commands.executeCommand("markdown-worklogs.gotoPreviousHeader");
		const position = editor.selection.active;
		assert.strictEqual(8, position.line);
	});
});
