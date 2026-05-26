import { getEditorTextarea, insertText } from '../TextInserter';

export const fixPunctuation = () => {
    let textarea = getEditorTextarea();
    if (!textarea) return;
    let val = textarea.value;
    // -- to em-dash, standardizing quotes, ellipsis
    val = val.replace(/--/g, '—')
             .replace(/(\w)-(\s|$)/g, '$1—$2')
             .replace(/ {2,}/g, ' ')
             .replace(/\.\.\./g, '…')
             .replace(/´|`|‘|’/g, "'");

    insertText('', ''); // Setup React tracker
    textarea.value = val;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
};
