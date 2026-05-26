export interface DropdownItem {
    label: string;
    action: () => void;
    span?: number;
}

export const createDropdown = (label: string, items: DropdownItem[], columns: number | string = 1) => {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'SmallButton__Container-sc-52e3e09f-0 eAerHv';
    btn.style.cssText = `display: grid; grid-template-columns: 1fr auto; align-items: center; width: 100%;`;
    btn.innerHTML = `<span style="justify-self: center;">${label}</span><span style="justify-self: end;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 7" width="8" height="6.21"><path d="M4.488 7 0 0h8.977L4.488 7Z"></path></svg></span>`;

    const menu = document.createElement('div');
    menu.style.cssText = `position: absolute; top: 107.5%; background: white; border: 1px solid #000; padding: 0.25rem; display: none; z-index: 9999; border-radius: 0.5rem; width: 100%; grid-template-columns: repeat(${columns === 'auto-fit' ? 'auto-fit' : columns}, minmax(1rem, 1fr)); gap: 0.125rem;`;

    items.forEach(item => {
        const itemBtn = document.createElement('button');
        itemBtn.innerHTML = item.label;
        itemBtn.style.cssText = `padding: 0.25rem; cursor: pointer; border-radius: 0.125rem; font-size: 0.75rem; border: none; background: transparent; transition: background 0.2s;`;
        itemBtn.onmouseover = () => itemBtn.style.background = '#f0f0f0';
        itemBtn.onmouseout = () => itemBtn.style.background = 'transparent';

        if (item.span) itemBtn.style.gridColumn = `span ${item.span}`;

        itemBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            item.action();
            menu.style.display = 'none';
        });
        menu.appendChild(itemBtn);
    });

    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const isVisible = menu.style.display === 'grid';
        document.querySelectorAll('.gtt-dropdown-menu').forEach(m => (m as HTMLElement).style.display = 'none'); // Close others
        menu.style.display = isVisible ? 'none' : 'grid';
    });

    menu.classList.add('gtt-dropdown-menu'); // Tag for global closing
    wrapper.appendChild(btn);
    wrapper.appendChild(menu);
    return wrapper;
};

// Global click handler to close dropdowns
if (typeof document !== 'undefined') {
    document.addEventListener('click', (e) => {
        if (!(e.target as HTMLElement).closest('.gtt-dropdown-menu') && !(e.target as HTMLElement).closest('button')) {
            document.querySelectorAll('.gtt-dropdown-menu').forEach(m => (m as HTMLElement).style.display = 'none');
        }
    });
}
