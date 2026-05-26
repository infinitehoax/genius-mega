export const createButton = (label: string, title: string, onClick: () => void, extraStyles: string = '') => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = title;
    // Using Genius generic styled classes
    btn.className = 'SmallButton__Container-sc-52e3e09f-0 eAerHv';
    btn.style.cssText = `min-width: 0px; width: 100%; display: flex; align-items: center; justify-content: center; ${extraStyles}`;
    btn.innerHTML = label;
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        onClick();
    });
    return btn;
};
