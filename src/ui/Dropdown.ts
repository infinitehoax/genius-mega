export interface DropdownItem {
    label: string;
    action: () => void;
    span?: number;
}

export const createDropdown = (label: string, items: DropdownItem[], columns: number | string = 1, isIcon: boolean = false) => {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'gtt-dropdown-button';
    btn.style.cssText = `
        height: 24px;
        display: flex;
        align-items: center;
        gap: 4px;
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 2px 6px;
        color: #555;
        border-radius: 2px;
        font-family: inherit;
        font-size: 13px;
    `;

    if (isIcon) {
        btn.innerHTML = `${label}`;
    } else {
        btn.innerHTML = `<span style="white-space: nowrap;">${label}</span> <svg width="8" height="6" viewBox="0 0 9 7" fill="currentColor" style="opacity: 0.6;"><path d="M4.488 7 0 0h8.977L4.488 7Z"></path></svg>`;
    }

    const menu = document.createElement('div');
    menu.className = 'gtt-dropdown-menu';
    menu.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        background: white;
        border: 1px solid #ccc;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        padding: 4px 0;
        display: none;
        z-index: 10000;
        min-width: 120px;
        max-height: 300px;
        overflow-y: auto;
    `;

    if (columns !== 1) {
        menu.style.display = 'none'; // Will be set to 'grid' when visible
        menu.style.gridTemplateColumns = `repeat(${columns === 'auto-fit' ? 'auto-fit' : columns}, minmax(30px, 1fr))`;
        menu.style.gap = '2px';
        menu.style.padding = '4px';
    }

    items.forEach(item => {
        const itemBtn = document.createElement('button');
        itemBtn.innerHTML = item.label;
        itemBtn.style.cssText = `
            display: block;
            width: 100%;
            padding: 6px 12px;
            text-align: left;
            cursor: pointer;
            border: none;
            background: transparent;
            font-size: 13px;
            color: #333;
            transition: background 0.1s;
        `;
        if (columns !== 1) {
            itemBtn.style.padding = '4px';
            itemBtn.style.textAlign = 'center';
            if (item.span) itemBtn.style.gridColumn = `span ${item.span}`;
        }

        itemBtn.onmouseover = () => itemBtn.style.background = '#f0f0f0';
        itemBtn.onmouseout = () => itemBtn.style.background = 'transparent';

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
        e.stopPropagation();
        const isVisible = menu.style.display === (columns === 1 ? 'block' : 'grid');
        document.querySelectorAll('.gtt-dropdown-menu').forEach(m => (m as HTMLElement).style.display = 'none');
        menu.style.display = isVisible ? 'none' : (columns === 1 ? 'block' : 'grid');
    });

    wrapper.appendChild(btn);
    wrapper.appendChild(menu);
    return wrapper;
};

if (typeof document !== 'undefined') {
    document.addEventListener('click', () => {
        document.querySelectorAll('.gtt-dropdown-menu').forEach(m => (m as HTMLElement).style.display = 'none');
    });
}
