export const createButton = (label: string, title: string, onClick: () => void, extraStyles: string = '') => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = title;
    // We'll use a more generic style now, but can keep the Genius class if it helps with base styles
    btn.className = 'gtt-button';
    btn.style.cssText = `
        min-width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 2px 4px;
        color: #555;
        border-radius: 2px;
        font-family: inherit;
        font-size: 13px;
        transition: background 0.1s;
        ${extraStyles}
    `;
    btn.innerHTML = label;

    btn.onmouseover = () => btn.style.background = '#e8e8e8';
    btn.onmouseout = () => btn.style.background = 'transparent';

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        onClick();
    });
    return btn;
};
