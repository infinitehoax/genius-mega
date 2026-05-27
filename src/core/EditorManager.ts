export const getEditorTextarea = () =>
    document.querySelector('textarea[class*="Textarea__Input"], textarea[class*="LyricsTextareaInput"], textarea[class*="LyricsEdit-desktop__Textarea"]') as HTMLTextAreaElement;

export const insertText = (openTag: string, closeTag: string = '') => {
    const textarea = getEditorTextarea();
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let newText = text.substring(0, start) + openTag + selectedText + closeTag + text.substring(end);

    // Update value
    textarea.value = newText;

    // Trigger React's synthetic input event so the Save button enables
    const event = new Event('input', { bubbles: true });
    // Hack to get past React 16+ event pooling
    const tracker = (textarea as any)._valueTracker;
    if (tracker) tracker.setValue('');
    textarea.dispatchEvent(event);

    // Restore cursor position
    textarea.focus();
    textarea.setSelectionRange(start + openTag.length, start + openTag.length + selectedText.length);
};

export const applyListFormatting = (type: 'ul' | 'ol') => {
    const textarea = getEditorTextarea();
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    const lines = selectedText.split('\n');
    const formattedLines = lines.map(line => `  <li>${line}</li>`);
    const openTag = `<${type}>\n`;
    const closeTag = `\n</${type}>`;
    const replacement = openTag + formattedLines.join('\n') + closeTag;

    textarea.setRangeText(replacement, start, end, 'select');
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
};

export const applyAlignment = (align: 'left' | 'center' | 'right') => {
    const textarea = getEditorTextarea();
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    const openTag = `<div align="${align}">\n`;
    const closeTag = `\n</div>`;
    const replacement = openTag + selectedText + closeTag;

    textarea.setRangeText(replacement, start, end, 'select');
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
};
