export const getEditorTextarea = () =>
    document.querySelector('textarea[class*="LyricsEdit-desktop__Textarea"], textarea[class*="LyricsTextareaInput"]') as HTMLTextAreaElement;

export const insertText = (openTag: string, closeTag: string = '') => {
    const textarea = getEditorTextarea();
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    const newText = text.substring(0, start) + openTag + selectedText + closeTag + text.substring(end);

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
