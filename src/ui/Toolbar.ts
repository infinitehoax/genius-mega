import { createStylesGrid } from './Styles';
import { Icons } from './Icons';
import { createDropdown } from './Dropdown';
import { insertText } from '../core/EditorManager';

export const buildEditorToolbar = (container: HTMLElement, textarea: HTMLTextAreaElement) => {
    if (container.querySelector('#gtt-lyrics-toolbar')) return;

    const toolbar = document.createElement('div');
    toolbar.id = 'gtt-lyrics-toolbar';
    toolbar.style.cssText = `
        display: flex;
        align-items: center;
        gap: 4px;
        background: #f1f1f1;
        border: 1px solid #ccc;
        border-bottom: none;
        padding: 4px 8px;
        border-top-left-radius: 4px;
        border-top-right-radius: 4px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        box-sizing: border-box;
        width: 100%;
    `;

    // 1. Format Dropdown (Sections)
    const sections = [
        'Instrumental', 'Snippet', 'Intro', 'Outro', 'Skit', 'Part',
        'Verse', 'Pre-Chorus', 'Chorus', 'Post-Chorus', 'Refrain',
        'Bridge', 'Breakdown', 'Interlude', 'Build', 'Drop'
    ];

    const formatItems = sections.map(sec => ({
        label: sec, action: () => insertText(`[${sec}]\n`)
    }));

    const formatDropdown = createDropdown('Format', formatItems);
    toolbar.appendChild(formatDropdown);

    // Separator
    const sep1 = document.createElement('div');
    sep1.style.cssText = "width: 1px; height: 18px; background: #ccc; margin: 0 4px;";
    toolbar.appendChild(sep1);

    // 2. Style Row (B, I, U, S, etc.)
    toolbar.appendChild(createStylesGrid());

    // Inject
    container.insertBefore(toolbar, textarea);

    // UI Polish
    textarea.style.borderTopLeftRadius = '0';
    textarea.style.borderTopRightRadius = '0';
    textarea.style.borderTop = 'none';
    textarea.style.marginTop = '0';
};
