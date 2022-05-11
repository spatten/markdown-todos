import * as assert from 'assert';
import * as vscode from 'vscode';
import * as helpers from '../helpers';
import * as MarkdownTodos from '../../extension';

const assertTodoStateAtLine = (editor: vscode.TextEditor, lineNumber: number, expectedState: string) => {
  const lineText = editor.document.lineAt(lineNumber).text;
  const header = MarkdownTodos.getHeaderInfo(lineText);
  assert.strictEqual(header.todoState, expectedState);
};

describe('change TODO functions', async function () {
  let editor: vscode.TextEditor;
  beforeEach(async function () {
    editor = await helpers.openExample('todos.md');
  });

  describe('increaseTodo', async function () {
    afterEach(async () => {
      // we need to close the document so it gets reloaded fresh from the fixture for each test
      await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    });

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

    context('with insertCompleteTimestamp on', async () => {
      beforeEach(async () => {
        await helpers.setConfig('markdown-worklogs.insertCompletionTimestamp', true);
      });

      it('should insert the timestamp when going from TODO to DONE', async () => {
        helpers.gotoLine(editor, 0);
        await vscode.commands.executeCommand("markdown-worklogs.increaseTodo");
        const lineText = editor.document.lineAt(1).text;
        assert.match(lineText, /^\s*CLOSED:/);
      });

      it('should remove the timestamp when going from DONE to ""', async () => {
        helpers.gotoLine(editor, 0);
        // go from TODO => DONE
        await vscode.commands.executeCommand("markdown-worklogs.increaseTodo");
        // go from DONE => ''
        await vscode.commands.executeCommand("markdown-worklogs.increaseTodo");
        const lineText = editor.document.lineAt(1).text;
        assert.match(lineText, /^This is/);
      });
    });

    context('with insertCompleteTimestamp off', async () => {
      beforeEach(async () => {
        await helpers.setConfig('markdown-worklogs.insertCompletionTimestamp', false);
      });

      it('should not insert a timestamp when going from TODO to DONE', async () => {
        helpers.setConfig('markdown-worklogs.insertCompletionTimestamp', false);
        helpers.gotoLine(editor, 0);
        await vscode.commands.executeCommand("markdown-worklogs.increaseTodo");
        const lineText = editor.document.lineAt(1).text;
        assert.match(lineText, /^This is/);
      });

      it('should remove an existing timestamp when going from DONE to ""', async () => {
        helpers.gotoLine(editor, 0);
        await helpers.setConfig('markdown-worklogs.insertCompletionTimestamp', true);
        // go from TODO => DONE, and set the timestamp
        await vscode.commands.executeCommand("markdown-worklogs.increaseTodo");

        // now, turn timestamps off. Going from DONE => '' should still remove the existing timestamp
        await helpers.setConfig('markdown-worklogs.insertCompletionTimestamp', false);
        // go from DONE => ''
        await vscode.commands.executeCommand("markdown-worklogs.increaseTodo");
        const lineText = editor.document.lineAt(1).text;
        assert.match(lineText, /^This is/);
      });
    });
  });

  describe('decreaseTodo', async function () {
    it('should change the todo on the current line', async () => {
      // the top line is initially at TODO
      helpers.gotoLine(editor, 0);

      // Change from TODO to ''
      await vscode.commands.executeCommand("markdown-worklogs.decreaseTodo");
      assertTodoStateAtLine(editor, 0, '');

      // Change from '' to DONE
      await vscode.commands.executeCommand("markdown-worklogs.decreaseTodo");
      assertTodoStateAtLine(editor, 0, 'DONE');

      // Change from DONE to TODO
      await vscode.commands.executeCommand("markdown-worklogs.decreaseTodo");
      assertTodoStateAtLine(editor, 0, 'TODO');
    });

    it('should change the todo on the header above the current line', async () => {
      // the top line is initially at TODO
      helpers.gotoLine(editor, 2);

      // Change from TODO to ''
      await vscode.commands.executeCommand("markdown-worklogs.decreaseTodo");
      assertTodoStateAtLine(editor, 0, '');

      // Change from '' to DONE
      await vscode.commands.executeCommand("markdown-worklogs.decreaseTodo");
      assertTodoStateAtLine(editor, 0, 'DONE');

      // Change from DONE to TODO
      await vscode.commands.executeCommand("markdown-worklogs.decreaseTodo");
      assertTodoStateAtLine(editor, 0, 'TODO');
    });
  });
});
