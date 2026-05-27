import { createButton } from './ButtonBuilder';
import { createDropdown } from './Dropdown';
import { insertText, applyListFormatting, applyAlignment } from '../core/EditorManager';
import { fixPunctuation } from '../features/Cleanups/Punctuation';
import { fixCapitalization } from '../features/Cleanups/Capitalization';
import { Icons } from './Icons';

export const createStylesGrid = () => {
    const container = document.createElement('div');
    container.style.cssText = "display: flex; align-items: center; gap: 2px; flex: 1;";

    // Bold, Italic, Underline, Strikethrough
    container.appendChild(createButton(Icons.Bold, 'Bold', () => insertText('<b>', '</b>')));
    container.appendChild(createButton(Icons.Italic, 'Italic', () => insertText('<i>', '</i>')));
    container.appendChild(createButton(Icons.Underline, 'Underline', () => insertText('<u>', '</u>')));
    container.appendChild(createButton(Icons.Strikethrough, 'Strikethrough', () => insertText('<s>', '</s>')));

    // Separator
    const sep = document.createElement('div');
    sep.style.cssText = "width: 1px; height: 18px; background: #ddd; margin: 0 4px;";
    container.appendChild(sep);

    // Lists
    container.appendChild(createButton(Icons.ListUnordered, 'Unordered List', () => applyListFormatting('ul')));
    container.appendChild(createButton(Icons.ListOrdered, 'Ordered List', () => applyListFormatting('ol')));

    // Separator
    const sep2 = document.createElement('div');
    sep2.style.cssText = "width: 1px; height: 18px; background: #ddd; margin: 0 4px;";
    container.appendChild(sep2);

    // Alignment
    container.appendChild(createButton(Icons.AlignLeft, 'Align Left', () => applyAlignment('left')));
    container.appendChild(createButton(Icons.AlignCenter, 'Align Center', () => applyAlignment('center')));
    container.appendChild(createButton(Icons.AlignRight, 'Align Right', () => applyAlignment('right')));

    // Separator
    const sep3 = document.createElement('div');
    sep3.style.cssText = "width: 1px; height: 18px; background: #ddd; margin: 0 4px;";
    container.appendChild(sep3);

    // Clear Formatting
    container.appendChild(createButton(Icons.Clear, 'Clear Formatting', () => {
        const textarea = (document.querySelector('textarea') as HTMLTextAreaElement);
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value.substring(start, end);
        const cleaned = text.replace(/<[^>]*>/g, '');
        textarea.setRangeText(cleaned, start, end, 'select');
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }));

    // More Dropdown
    const moreItems = [
        { label: 'Fix Punctuation', action: fixPunctuation },
        { label: 'Fix Capitalization', action: fixCapitalization },
        { label: 'ZWSP', action: () => insertText('\u200B') },
        { label: 'NBSP', action: () => insertText('\u00A0') }
    ];

    const diacriticsUC = 'ÁÀÂÄÉÈÊËÍÌÎÏÓÒÔÖÚÙÛÜĆŃŚŹČĞŠŽÇŞIÑĐÆŒẞ'.split('').map(char => ({
        label: char, action: () => insertText(char)
    }));

    const diacriticsLC = 'áàâäéèêëíìîïóòôöúùûüćńśźčğšžçşıñđæœß'.split('').map(char => ({
        label: char, action: () => insertText(char)
    }));

    const moreDropdown = createDropdown(Icons.More, [
        ...moreItems,
        { label: '--- Diacritics (UC) ---', action: () => {} },
        ...diacriticsUC,
        { label: '--- Diacritics (LC) ---', action: () => {} },
        ...diacriticsLC
    ], 1, true);

    const moreWrapper = document.createElement('div');
    moreWrapper.style.marginLeft = 'auto';
    moreWrapper.appendChild(moreDropdown);
    container.appendChild(moreWrapper);

    return container;
};
