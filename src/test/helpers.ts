import * as path from "path";
import * as vscode from 'vscode';

const fixtureLocation = "/../../src/test/fixtures/";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function openExample(exampleName: string, params: { lineNumber?: number }): Promise<vscode.TextEditor> {
  const uri = vscode.Uri.file(path.join(__dirname + fixtureLocation + exampleName));
  const document = await vscode.workspace.openTextDocument(uri);
  const editor = await vscode.window.showTextDocument(document);
  await sleep(500);
  if (params.lineNumber !== undefined) {
    const newPosition = new vscode.Position(params.lineNumber, 0);
    const newSelection = new vscode.Selection(newPosition, newPosition);
    editor.selection = newSelection;
  }
  return editor;
}
