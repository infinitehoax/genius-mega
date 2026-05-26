import { createSectionsGrid } from './Sections';
import { createStylesGrid } from './Styles';

export const buildEditorToolbar = (container: HTMLElement) => {
    if (container.querySelector('#gtt-lyrics-toolbar')) return; // Already injected

    const toolbar = document.createElement('div');
    toolbar.id = 'gtt-lyrics-toolbar';
    toolbar.style.cssText = "margin-top: 2rem; margin-bottom: 1rem;";

    toolbar.appendChild(createSectionsGrid());
    toolbar.appendChild(createStylesGrid());

    // Insert just before the Explainer text
    const explainer = container.querySelector('[class*="LyricsEditExplainer"]');
    if (explainer) {
        container.insertBefore(toolbar, explainer);
    } else {
        container.appendChild(toolbar);
    }
};
