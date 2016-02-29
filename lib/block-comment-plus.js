'use babel';

import languages from './languages.js';
import {Point, Range} from 'atom';

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
      const selectionRange = selection.getBufferRange();
      const hasTextSelected = selection.getText().length > 0;
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
      const language = startLanguage;

      if (typeof languages[startLanguage] != 'undefined') {
        let lng = languages[startLanguage];
        commentStart = lng.start;
        commentEnd = lng.end;
        addNewLine = lng.newLine ? lng.newLine : false;
      }

      if (isInBlockComment(bufferRange.start) && isInBlockComment(bufferRange.end)) {
        const selectionText = selection.getText();

        if (selectionText.startsWith(commentStart) && selectionText.endsWith(commentEnd)) {
          let replaced = selectionText.trim().substr(commentStart.length);
          replaced = replaced.substr(0, replaced.length - commentEnd.length);
          selection.insertText(replaced, {select: true});
        }
        else {
          const startRow = searchCommentRow(bufferRange.start, commentStart, commentEnd, true);
          const foundStart = rowContainsCommentToken(startRow, commentStart);
          let endRow = searchCommentRow(bufferRange.end, commentStart, commentEnd);

          const foundEnd = rowContainsCommentToken(endRow, commentEnd);

          if (foundStart && foundEnd) {
            removeCommentToken(startRow, commentStart, addNewLine);
            if (addNewLine) endRow--;
            removeCommentToken(endRow, commentEnd, addNewLine);

            if (selection.getText().length > 0) {
              // @TODO shift selection when comment tokens
              // are added on new lines
              let newSelectionRange = new Range(
                new Point(
                  selectionRange.start.row,
                  selectionRange.start.column - commentStart.length
                ),
                selectionRange.end
              );
              selection.setBufferRange(newSelectionRange);
            }

          }
          else {
            const editorView = atom.views.getView(editor)
            atom.commands.dispatch(editorView, 'editor:toggle-line-comments');
          }
        }

      }
      else {
        const selectionText = selection.getText();
        const start = selectionText.trim().substr(0, commentStart.length);
        const end = selectionText.trim().substr(-1 * commentEnd.length);

        if (start === commentStart && end === commentEnd) {
          let replaced = selectionText.trim().substr(commentStart.length);
          replaced = replaced.substr(0, replaced.length - commentEnd.length);
          selection.insertText(replaced, {select: true});
        }
        else {
          const innerWrapper = addNewLine ? "\n" : "";
          selection.insertText(
            commentStart + innerWrapper +
            selectionText + innerWrapper +
            commentEnd
          );

          if (hasTextSelected) {
            // @TODO shift selection when comment tokens
            // are added on new lines
            let newSelectionRange = new Range(
              new Point(
                selectionRange.start.row,
                selectionRange.start.column + commentStart.length
              ),
              selectionRange.end
            );

            selection.setBufferRange(newSelectionRange);
          }
        }
      }
    }
  });

  function getLanguage(point) {
    let language = null;
    const scopes = editor.scopeDescriptorForBufferPosition(point).getScopesArray();

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

  function searchCommentRow(point, startToken, endToken, backwards = false) {
    let row = point.row;
    const end = backwards ? 0 : buffer.getLastRow();
    let found = false;
    const stopIfFound = backwards ? endToken : startToken;
    const token = backwards ? startToken : endToken;

    if (backwards) {
      while (row >= 0) {
        let rowText = buffer.lineForRow(row);
        if (rowText.includes(stopIfFound)) {
          if (rowText.indexOf(stopIfFound) > rowText.indexOf(token)) {
            return point.row;
          }
        }
        if (rowText.includes(token)) {
          found = true;
          return row;
        }
        row--;
      }
    }
    else {
      while (row <= buffer.getLastRow()) {
        let rowText = buffer.lineForRow(row);
        if (rowText.includes(stopIfFound)) {
          if (rowText.indexOf(stopIfFound) < rowText.indexOf(token)) {
            return point.row;
          }
        }
        if (rowText.includes(token)) {
          found = true;
          return row;
        }
        row++;
      }
    }

    return end;
  }

  function rowContainsCommentToken(row, token) {
    const rowText = buffer.lineForRow(row);
    return rowText.includes(token);
  }

  function removeCommentToken(row, token, shouldDeleteRow) {
    const rowText = buffer.lineForRow(row);

    const replaceText = rowText.replace(token, '');
    const range = [[row, 0], [row, rowText.length]];

    buffer.setTextInRange(range, replaceText);

    if (shouldDeleteRow) {
      buffer.deleteRow(row);
    }

    return true;
  }

  function selectionIsEmpty(selection) {
    const br = selection.getBufferRange();
    return br.start.row === br.end.row && br.start.column === br.end.column;
  }


}
