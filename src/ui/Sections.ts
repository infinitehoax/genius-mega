import { createButton } from './ButtonBuilder';
import { insertText } from '../core/EditorManager';

export const createSectionsGrid = () => {
    const sectionsGrid = document.createElement('div');
    sectionsGrid.style.cssText = "display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; margin-bottom: 1rem;";

    const sections = [
        'Instrumental', 'Snippet', 'Intro', 'Outro', 'Skit', 'Part',
        'Verse', 'Pre-Chorus', 'Chorus', 'Post-Chorus', 'Refrain',
        'Bridge', 'Breakdown', 'Interlude', 'Build', 'Drop'
    ];

    // Add 2 hidden buttons for layout alignment
    sectionsGrid.appendChild(createButton('', '', () => {}, 'visibility: hidden;'));
    sectionsGrid.appendChild(createButton('', '', () => {}, 'visibility: hidden;'));

    sections.forEach(sec => {
        sectionsGrid.appendChild(createButton(sec, sec, () => insertText(`[${sec}]\n`)));
    });

    return sectionsGrid;
};
