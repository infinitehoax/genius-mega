import { getEditorTextarea, insertText } from '../TextInserter';

export const fixCapitalization = () => {
    let textarea = getEditorTextarea();
    if (!textarea) return;
    let val = textarea.value.split('\n').map(line => {
        // Capitalize first alphanumeric character of a line
        return line.replace(/^([^a-zA-Z]*)([a-zA-Z])/, (match, p1, p2) => p1 + p2.toUpperCase());
    }).join('\n');

    insertText('', '');
    textarea.value = val;
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
};
