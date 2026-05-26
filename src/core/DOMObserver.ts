import { buildEditorToolbar } from '../ui/Toolbar';

export const initObserver = () => {
    const observer = new MutationObserver(() => {
        // Look for the controls container inside the editor form
        const controlsContainer = document.querySelector('[class*="LyricsEdit-desktop__Controls-sc"]') as HTMLElement;
        if (controlsContainer) {
            buildEditorToolbar(controlsContainer);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
};
