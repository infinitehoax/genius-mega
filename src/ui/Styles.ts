import { createButton } from './ButtonBuilder';
import { createDropdown } from './Dropdown';
import { insertText } from '../core/EditorManager';
import { fixPunctuation } from '../features/Cleanups/Punctuation';
import { fixCapitalization } from '../features/Cleanups/Capitalization';

export const createStylesGrid = () => {
    const stylesGrid = document.createElement('div');
    stylesGrid.style.cssText = "display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px;";

    stylesGrid.appendChild(createButton('<i>Italic</i>', 'Italic', () => insertText('<i>', '</i>')));
    stylesGrid.appendChild(createButton('<b>Bold</b>', 'Bold', () => insertText('<b>', '</b>')));
    stylesGrid.appendChild(createButton('<b><i>Italic + Bold</i></b>', 'Italic+Bold', () => insertText('<b><i>', '</i></b>')));
    stylesGrid.appendChild(createButton('Parentheses', 'Parentheses', () => insertText('(', ')')));

    // Diacritics Uppercase
    const upperDiacritics = 'ÁÀÂÄÉÈÊËÍÌÎÏÓÒÔÖÚÙÛÜĆŃŚŹČĞŠŽÇŞIÑĐÆŒẞ'.split('');
    stylesGrid.appendChild(createDropdown('Diacritics (UC)', upperDiacritics.map(char => ({
        label: char, action: () => insertText(char)
    })), 'auto-fit'));

    // Diacritics Lowercase
    const lowerDiacritics = 'áàâäéèêëíìîïóòôöúùûüćńśźčğšžçşıñđæœß'.split('');
    stylesGrid.appendChild(createDropdown('Diacritics (LC)', lowerDiacritics.map(char => ({
        label: char, action: () => insertText(char)
    })), 'auto-fit'));

    // Symbols
    stylesGrid.appendChild(createDropdown('Symbols', [
        { label: '(', action: () => insertText('(') },
        { label: ')', action: () => insertText(')') },
        { label: '<', action: () => insertText('<') },
        { label: '>', action: () => insertText('>') },
        { label: '–', action: () => insertText('–') }, // En-dash
        { label: '—', action: () => insertText('—') }, // Em-dash
        { label: '„...“', span: 2, action: () => insertText('„', '“') },
        { label: 'ZWSP', span: 2, action: () => insertText('\u200B') }, // Zero width space
        { label: 'NBSP', span: 2, action: () => insertText('\u00A0') }  // Non-breaking space
    ], 'auto-fit'));

    // Cleanups Menu
    stylesGrid.appendChild(createDropdown('🧹 Cleanups', [
        { label: 'Fix Punctuation', span: 1, action: fixPunctuation },
        { label: 'Fix Capitalization', span: 1, action: fixCapitalization }
    ], 1));

    return stylesGrid;
};
