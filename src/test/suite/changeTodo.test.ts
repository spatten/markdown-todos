import * as assert from 'assert';
import * as vscode from 'vscode';
import * as helpers from '../helpers';
import * as MarkdownTodos from '../../extension';

const assertTodoStateAtLine = (editor: vscode.TextEditor, lineNumber: number, expectedState: string) => {
  const lineText = editor.document.lineAt(lineNumber).text;
  const header = MarkdownTodos.getHeaderInfo(lineText);
  assert.strictEqual(expectedState, header.todoState);
};

describe('change TODO functions', async function () {
  let editor: vscode.TextEditor;
  before(async function () {
    editor = await helpers.openExample('todos.md', { lineNumber: 23 });
  });

  describe('increaseTodo', async function () {
    it('should change the todo on the current line', async () => {
      // the top line is initially at TODO
      helpers.gotoLine(editor, 0);

      // Change from TODO to DONE
      await vscode.commands.executeCommand("markdown-worklogs.increaseTodo");
      assertTodoStateAtLine(editor, 0, 'DONE');

      // Change from DONE to ''
      await vscode.commands.executeCommand("markdown-worklogs.increaseTodo");
      assertTodoStateAtLine(editor, 0, '');

      // Change from '' to TODO
      await vscode.commands.executeCommand("markdown-worklogs.increaseTodo");
      assertTodoStateAtLine(editor, 0, 'TODO');
    });

    it('should change the todo on the header above the current line', async () => {
      // the top line is initially at TODO
      helpers.gotoLine(editor, 2);

      // Change from TODO to DONE
      await vscode.commands.executeCommand("markdown-worklogs.increaseTodo");
      assertTodoStateAtLine(editor, 0, 'DONE');

      // Change from DONE to ''
      await vscode.commands.executeCommand("markdown-worklogs.increaseTodo");
      assertTodoStateAtLine(editor, 0, '');

      // Change from '' to TODO
      await vscode.commands.executeCommand("markdown-worklogs.increaseTodo");
      assertTodoStateAtLine(editor, 0, 'TODO');
    });
  });


  describe('decreaseTodo', async function () {
    it('should change the todo on the current line', async () => {
      // the top line is initially at TODO
      helpers.gotoLine(editor, 0);

      // Change from TODO to DONE
      await vscode.commands.executeCommand("markdown-worklogs.decreaseTodo");
      assertTodoStateAtLine(editor, 0, '');

      // Change from DONE to ''
      await vscode.commands.executeCommand("markdown-worklogs.decreaseTodo");
      assertTodoStateAtLine(editor, 0, 'DONE');

      // Change from '' to TODO
      await vscode.commands.executeCommand("markdown-worklogs.decreaseTodo");
      assertTodoStateAtLine(editor, 0, 'TODO');
    });

    it('should change the todo on the header above the current line', async () => {
      // the top line is initially at TODO
      helpers.gotoLine(editor, 2);

      // Change from TODO to DONE
      await vscode.commands.executeCommand("markdown-worklogs.decreaseTodo");
      assertTodoStateAtLine(editor, 0, '');

      // Change from DONE to ''
      await vscode.commands.executeCommand("markdown-worklogs.decreaseTodo");
      assertTodoStateAtLine(editor, 0, 'DONE');

      // Change from '' to TODO
      await vscode.commands.executeCommand("markdown-worklogs.decreaseTodo");
      assertTodoStateAtLine(editor, 0, 'TODO');
    });
  });
});
