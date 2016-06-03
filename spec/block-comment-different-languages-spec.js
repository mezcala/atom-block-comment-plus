'use babel';

import path from 'path';
import languages from '../lib/languages.js';

describe('[HTML/PHP]', () => {
  let editor;
  let editorView;
  let activationPromise;

  beforeEach(() => {
    workspaceElement = atom.views.getView(atom.workspace);
    atom.project.setPaths([path.join(__dirname, 'fixtures')]);

    waitsForPromise(() => {
      return atom.packages.activatePackage('language-php');
    });

    waitsForPromise(() => {
      return atom.packages.activatePackage('language-html');
    });

    waitsForPromise(() => {
      return atom.workspace.open('sample.html.php');
    });

    runs(() => {
      editor = atom.workspace.getActiveTextEditor();
      editorView = atom.views.getView(editor);
      activationPromise = atom.packages.activatePackage("block-comment-plus");
    });
  });

  it('should add an HTML comment block', () => {
    editor.setCursorBufferPosition([7, 0]);
    editor.selectToBufferPosition([8, 31]);

    atom.commands.dispatch(editorView, 'block-comment-plus:toggle');

    waitsForPromise(() => {
      return activationPromise;
    });

    runs(() => {
      expect(
        editor.getTextInBufferRange([[7, 0], [7, 4]])
      ).toBe(languages.html.start);

      expect(
        editor.getTextInBufferRange([[8, 31], [8, 34]])
      ).toBe(languages.html.end);
    });
  });

  it('should add a PHP comment block', () => {
    editor.setCursorBufferPosition([8, 13]);
    editor.selectToBufferPosition([8, 24]);

    atom.commands.dispatch(editorView, 'block-comment-plus:toggle');

    waitsForPromise(() => {
      return activationPromise;
    });

    runs(() => {
      expect(
        editor.getTextInBufferRange([[8, 13], [8, 15]])
      ).toBe('/*');

      expect(
        editor.getTextInBufferRange([[8, 26], [8, 28]])
      ).toBe('*/');
    });
  });

  it('should remove an HTML comment block', () => {
    editor.setCursorBufferPosition([18, 4]);
    editor.selectToBufferPosition([20, 11]);

    atom.commands.dispatch(editorView, 'block-comment-plus:toggle');

    waitsForPromise(() => {
      return activationPromise;
    });

    runs(() => {
      expect(
        editor.getTextInBufferRange([[18, 4], [18, 8]])
      ).not.toBe('<!--');

      expect(
        editor.getTextInBufferRange([[20, 8], [20, 11]])
      ).not.toBe('-->');
    });
  });

  it('should remove an HTML comment block without selection', () => {
    editor.setCursorBufferPosition([19, 4]);

    atom.commands.dispatch(editorView, 'block-comment-plus:toggle');

    waitsForPromise(() => {
      return activationPromise;
    });

    runs(() => {
      expect(
        editor.getTextInBufferRange([[18, 4], [18, 8]])
      ).not.toBe('<!--');

      expect(
        editor.getTextInBufferRange([[20, 8], [20, 11]])
      ).not.toBe('-->');
    });
  });

  it('should not add a comment block', () => {
    editor.setCursorBufferPosition([8, 4]);
    editor.selectToBufferPosition([8, 24]);

    atom.commands.dispatch(editorView, 'block-comment-plus:toggle');

    waitsForPromise(() => {
      return activationPromise;
    });

    runs(() => {
      expect(
        editor.getTextInBufferRange([[8, 4], [8, 6]])
      ).toBe('<p')

      expect(
        editor.getTextInBufferRange([[8, 24], [8, 26]])
      ).toBe(' ?')
    });
  });
});
