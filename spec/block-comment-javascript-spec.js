'use babel';

import path from 'path';
import languages from '../lib/languages.js';

describe('[Javascript]', () => {
  let editor;
  let workspaceElement;
  let editorView;
  let activationPromise;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    atom.project.setPaths([path.join(__dirname, 'fixtures')]);

    waitsForPromise(() => {
      return atom.packages.activatePackage('language-javascript');
    });

    waitsForPromise(() => {
      return atom.workspace.open('sample.js');
    });

    runs(() => {
      editor = atom.workspace.getActiveTextEditor();
      editorView = atom.views.getView(editor);
      activationPromise = atom.packages.activatePackage("block-comment-plus");
    });
  });

  it('should wadd a comment block from beginning of line 3 to end of line 5', () => {
    editor.setCursorBufferPosition([2, 0]);
    editor.selectToBufferPosition([4, 1]);
    atom.commands.dispatch(editorView, 'block-comment-plus:toggle');

    waitsForPromise(() => {
      return activationPromise;
    });

    runs(() => {
      expect(
        editor.getTextInBufferRange([[2, 0], [2, 2]])
      ).toBe("/*");

      expect(
        editor.getTextInBufferRange([[4, 1], [4, 3]])
      ).toBe("*/");
    });
  });

  it('should remove the comment block beginning at line 7 and ending at line 9', () => {
    editor.setCursorBufferPosition([6, 0]);
    editor.selectToBufferPosition([8, 1]);
    atom.commands.dispatch(editorView, 'block-comment-plus:toggle');

    waitsForPromise(() => {
      return activationPromise;
    });

    runs(() => {
      console.log('editor.getTextInBufferRange([[6, 0], [6, 2]])', editor.getTextInBufferRange([[6, 0], [6, 2]]));
      expect(
        editor.getTextInBufferRange([[6, 0], [6, 2]])
      ).not.toBe("/*");

      expect(
        editor.getTextInBufferRange([[8, 1], [8, 3]])
      ).not.toBe("*/");
    });
  });

  it('should remove the comment block beginning at line 7 and ending at line 9 without selecting text', () => {
    editor.setCursorBufferPosition([6, 5]);
    atom.commands.dispatch(editorView, 'block-comment-plus:toggle');

    waitsForPromise(() => {
      return activationPromise;
    });

    runs(() => {
      expect(
        editor.getTextInBufferRange([[6, 0], [6, 2]])
      ).not.toBe("/*");

      expect(
        editor.getTextInBufferRange([[8, 1], [8, 3]])
      ).not.toBe("*/");
    });
  });

  it('should remove comment if executed on a line-commented line', () => {
    editor.setCursorBufferPosition([10, 0]);
    atom.commands.dispatch(editorView, 'block-comment-plus:toggle');

    waitsForPromise(() => {
      return activationPromise;
    });

    runs(() => {
      expect(
        editor.getTextInBufferRange([[10, 0], [10, 2]])
      ).not.toBe("//");
    });
  });
});
