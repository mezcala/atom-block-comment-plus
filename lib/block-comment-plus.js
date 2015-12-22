'use babel';

import languages from './languages.js'

export function activate() {
  atom.commands.add('atom-text-editor:not([mini])', {
    'block-comment-plus:toggle': toggle

  });
}

function toggle() {
  const editor = atom.workspace.getActiveTextEditor();
  const buffer = editor.getBuffer();
  const selections = editor.getSelections();

  buffer.transact(() => {
    for (i in selections) {
      const selection = selections[i];
      let bufferRange = selection.getBufferRange();
      let startLanguage = getLanguage(bufferRange.start);
      let endLanguage = getLanguage(bufferRange.end);

      // defaults to C based comments
      let commentStart = '/*';
      let commentEnd = '*/';
      let addNewLine = false;

      if (startLanguage !== endLanguage || startLanguage === "plain") {
        continue;
      }

      if (typeof languages[startLanguage] != 'undefined') {
        let lng = languages[startLanguage];
        commentStart = lng.start;
        commentEnd = lng.end;
        addNewLine = lng.newLine ? lng.newLine : false;
      }

      if (isInBlockComment(bufferRange.start) && isInBlockComment(bufferRange.end)) {
        const startRow = searchCommentRow(bufferRange.start, commentStart, true);
        let endRow = searchCommentRow(bufferRange.end, commentEnd);

        removeCommentToken(startRow, commentStart, addNewLine);

        if (addNewLine) endRow--;
        removeCommentToken(endRow, commentEnd, addNewLine);

      } else {
        const selectionText = selection.getText();
        const start = selectionText.trim().substr(0, commentStart.length);
        const end = selectionText.trim().substr(-1 * commentEnd.length);

        if (start === commentStart && end === commentEnd) {
          let replaced = selectionText.trim().substr(commentStart.length);
          replaced = replaced.substr(0, replaced.length - commentEnd.length);
          selection.insertText(replaced, {select: true});
        } else {
          const innerWrapper = addNewLine ? "\n" : "";
          selection.insertText(commentStart + innerWrapper + selectionText + innerWrapper + commentEnd);
        }
      }
    }
  });

  function getLanguage(point) {
    let language = null;
    const scopes = editor.scopeDescriptorForBufferPosition(point).getScopesArray();
    console.log('scopes', scopes);

    if (scopes.length > 1) {
      for (i in scopes) {
        const item = scopes[i];
        if (item.match(/source/g)) {
          let scope = item.split('.');
          language = scope[1];
          break;
        }
      }
    }

    if (language === null) {
      let scope = scopes[0].split('.');
      language = scope[1];
    }

    return language;
  }

  function isInBlockComment(point) {
    const scopes = editor.scopeDescriptorForBufferPosition(point).getScopesArray();
    let isCommented = false;

    if (scopes.length > 1) {
      for (i in scopes) {
        let scope = scopes[i];
        if (scope.match(/comment/g)) {
          isCommented = true;
          break;
        }
      }
    }

    return isCommented;
  }

  function searchCommentRow(point, token, backwards = false) {
    let row = point.row;
    const end = backwards ? buffer.getLastRow() : 0;
    let found = false;

    while (() => { return backwards ? row >= end : row <= end; }) {
      let rowText = buffer.lineForRow(row);
      if (rowText.includes(token)) {
        found = true;
        break;
      }
      backwards ? row-- : row++;
    }

    return found ? row : end;
  }

  function removeCommentToken(row, token, shouldDeleteRow) {
    const rowText = buffer.lineForRow(row);
    const replaceText = rowText.replace(token, '');
    const range = [[row, 0], [row, rowText.length]];
    buffer.setTextInRange(range, replaceText);
    if (shouldDeleteRow) {
      buffer.deleteRow(row);
    }
  }

  function selectionIsEmpty(selection) {
    const br = selection.getBufferRange();
    return br.start.row === br.end.row && br.start.column === br.end.column;
  }


}
