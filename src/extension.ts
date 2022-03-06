// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "markdown-todos" is now active!');

	let increaseTodo = vscode.commands.registerCommand('markdown-todos.increaseTodo', async () => {
		let editor = vscode.window.activeTextEditor;
		if (!editor) { return; }

		let lineIndex = editor.selection.active.line;
		let lineText = editor.document.lineAt(lineIndex).text;

		// Return if it's not a header
		if (!lineText.match(/^\s*#/)) { return; }

		const match = /(^\s*)([#]+)(\s*)([^ ]*)/.exec(lineText);
		if (!match) { return; }
		const [leading, octos, trailing, firstWord] = match.slice(1);
		return await editor.edit((editBuilder) => {
			const startPos = (leading + octos + trailing).length;
			const endPos = (leading + octos + trailing + firstWord).length + 1;
			const replaceRange = new vscode.Range(new vscode.Position(lineIndex, startPos), new vscode.Position(lineIndex, endPos));
			switch (firstWord) {
				case 'TODO':
					editBuilder.replace(replaceRange, 'DONE ');
					break;
				case 'DONE':
					editBuilder.replace(replaceRange, '');
					break;
				default:
					editBuilder.insert(new vscode.Position(lineIndex, startPos), 'TODO ');
			}
		});
	});

	context.subscriptions.push(increaseTodo);

	let openCurrentWorklog = vscode.commands.registerCommand('markdown-todos.openCurrentWorklog', async () => {
		const worklogDir = "/Users/scott/Dropbox/work-logs";
		const entries = await fs.promises.readdir(worklogDir);
		const workLogs = entries.filter(entry => entry.match(/\d\d\d\d-\d\d-\d\d\.md/));
		const currentLog = workLogs.sort()[0];
		let uri = vscode.Uri.file(path.join(worklogDir, currentLog));
		let success = await vscode.commands.executeCommand('vscode.open', uri);
	});

	context.subscriptions.push(openCurrentWorklog);
}

// this method is called when your extension is deactivated
export function deactivate() { }
