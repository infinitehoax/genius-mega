import { buildEditorToolbar } from '../ui/Toolbar';
import { getEditorTextarea } from './EditorManager';

export const initObserver = () => {
    const observer = new MutationObserver(() => {
        const textarea = getEditorTextarea();
        if (textarea && textarea.parentElement) {
            buildEditorToolbar(textarea.parentElement, textarea);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
};
