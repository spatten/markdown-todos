import * as path from "path";
import * as vscode from 'vscode';

const fixtureLocation = "/../../src/test/fixtures/";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function fixturePath(fixtureName: string): string {
  return __dirname + fixtureLocation + fixtureName;
}

export async function openExample(fixtureName: string, params?: { lineNumber?: number }): Promise<vscode.TextEditor> {
  const uri = vscode.Uri.file(fixturePath(fixtureName));
  const document = await vscode.workspace.openTextDocument(uri);
  const editor = await vscode.window.showTextDocument(document);
  await sleep(500);
  if (params?.lineNumber !== undefined) {
    gotoLine(editor, params.lineNumber);
  }
  return editor;
}

export function gotoLine(editor: vscode.TextEditor, line: number) {
  const newPosition = new vscode.Position(line, 0);
  const newSelection = new vscode.Selection(newPosition, newPosition);
  editor.selection = newSelection;
}
