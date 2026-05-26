This is another person's previous work that semi-works now 'cause it is depreciated. Use this for reference, don't copy it or the design language.

```
// ==UserScript==
// @name         Genius Transcriber's Toolkit V5 (Complete Edition)
// @namespace    http://tampermonkey.net/
// @version      5.0
// @description  Complete transcription toolkit with auto-fix, number conversion, formatting tools, custom regex engine, and more
// @author       AI Assistant
// @match        *://genius.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=genius.com
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // --- State Variables ---
    let verseCounter = 1;
    let chorusCounter = 1;
    let autoSaveInterval = null;
    let lastSavedContent = '';
    let emDashMode = false;
    let numberConversionSkipList = new Set();

    // --- Settings & Configuration ---
    const DEFAULT_SETTINGS = {
        autoFixEnabled: true,
        fixCapitalization: true,
        fixContractions: true,
        fixSlang: true,
        fixFormatting: true,
        convertNumbers: true,
        detectBracketMismatch: true,
        emDashAuto: false
    };

    const NUMBER_WHITELIST = new Set([
        '808', '1600', '420', '187', '911', '24', '7', '247', '365',
        '411', '404', '101', '21', '16', '18', '21st', '24/7'
    ]);

    const WORD_WHITELIST = new Set([
        'gonna', 'wanna', 'gotta', 'tryna', 'kinda', 'sorta',
        'cause', 'til', 'bout', 'em', 'nothin', 'somethin'
    ]);

    // Number to text conversion map
    const NUMBER_MAP = {
        '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
        '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
        '10': 'ten', '11': 'eleven', '12': 'twelve', '13': 'thirteen',
        '14': 'fourteen', '15': 'fifteen', '16': 'sixteen', '17': 'seventeen',
        '18': 'eighteen', '19': 'nineteen', '20': 'twenty', '30': 'thirty',
        '40': 'forty', '50': 'fifty', '60': 'sixty', '70': 'seventy',
        '80': 'eighty', '90': 'ninety', '100': 'hundred', '1000': 'thousand'
    };

    // Load settings
    function loadSettings() {
        const saved = localStorage.getItem('gtt-settings');
        return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    }

    function saveSettings(settings) {
        localStorage.setItem('gtt-settings', JSON.stringify(settings));
    }

    let SETTINGS = loadSettings();

    // --- Custom Regex Rules ---
    function loadCustomRules() {
        const saved = localStorage.getItem('gtt-custom-rules');
        return saved ? JSON.parse(saved) : [];
    }

    function saveCustomRules(rules) {
        localStorage.setItem('gtt-custom-rules', JSON.stringify(rules));
    }

    let customRules = loadCustomRules();

    // --- Core Initializer ---
    const observer = new MutationObserver(() => {
        if (document.getElementById('gtt-toolkit-wrapper')) {
            return;
        }

        const controlsContainer = findControlsContainer();
        const lyricsTextarea = document.querySelector('textarea[class*="ExpandingTextarea__Textarea-sc-"]');

        if (controlsContainer && lyricsTextarea) {
            console.log('GTT V5: Editor and controls found. Initializing...');
            initializeToolkit(controlsContainer, lyricsTextarea);
            observer.disconnect();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    function findControlsContainer() {
        let container = document.querySelector('[class*="LyricsEdit-desktop__Controls-sc-"]');
        if (container) return container;

        const saveButton = document.querySelector('button[type="button"][class*="LyricsEdit-desktop__SaveButton-sc-"]');
        if (saveButton && saveButton.parentElement) return saveButton.parentElement;

        const formContainer = document.querySelector('form[class*="LyricsEdit-desktop__Container-sc-"]');
        if (formContainer) {
            container = formContainer.querySelector('[class*="LyricsEdit-desktop__Controls-sc-"]');
            if (container) return container;
        }

        return null;
    }

    // --- Main Setup Function ---
    function initializeToolkit(controlsContainer, lyricsTextarea) {
        try {
            injectToolkitUI(controlsContainer, lyricsTextarea);
            injectTranscriberDropdown(lyricsTextarea);
            attachGlobalHotkeys();
            startAutoSave(lyricsTextarea);
            checkAndRestoreDraft(lyricsTextarea);
            attachTextSelectionListener(lyricsTextarea);

            const saveButton = document.querySelector('button[class*="LyricsEdit-desktop__SaveButton-sc-"]');
            if (saveButton) {
                saveButton.addEventListener('click', clearDraft);
            }
        } catch (error) {
            console.error("GTT V5: Failed to initialize toolkit.", error);
        }
    }

    // --- UI Injection ---
    function injectToolkitUI(controlsContainer, lyricsTextarea) {
        const toolkitWrapper = document.createElement('div');
        toolkitWrapper.id = 'gtt-toolkit-wrapper';
        toolkitWrapper.style.cssText = `
            margin-bottom: 1.5rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid #e0e0e0;
            width: 100%;
        `;

        const title = document.createElement('h3');
        title.textContent = "Transcriber's Toolkit V5";
        title.style.cssText = `font-size: 1rem; font-weight: bold; margin-bottom: 0.75rem; color: #333;`;
        toolkitWrapper.appendChild(title);

        // Headers Section
        const headerSection = createSection("Headers", [
            { text: "[Intro]", insert: "[Intro]" },
            { text: "[Verse]", insert: "[Verse]", isCounter: true, counter: () => verseCounter++ },
            { text: "[Chorus]", insert: "[Chorus]", isCounter: true, counter: () => chorusCounter++ },
            { text: "[Pre-Chorus]", insert: "[Pre-Chorus]" },
            { text: "[Post-Chorus]", insert: "[Post-Chorus]" },
            { text: "[Bridge]", insert: "[Bridge]" },
            { text: "[Breakdown]", insert: "[Breakdown]" },
            { text: "[Outro]", insert: "[Outro]" },
            { text: "[Interlude]", insert: "[Interlude]" },
            { text: "[Refrain]", insert: "[Refrain]" },
            { text: "[Instrumental]", insert: "[Instrumental]" },
            { text: "[Skit]", insert: "[Skit]" },
        ], lyricsTextarea);
        toolkitWrapper.appendChild(headerSection);

        // Utility Section
        const utilitySection = createSection("Utility", [
            { text: "[Timestamp]", action: insertTimestamp },
            { text: "[Artist]", action: insertArtistName },
            { text: "[?]", insert: "[?]" },
            { text: "(Unintelligible)", insert: "(Unintelligible)" },
        ], lyricsTextarea);
        toolkitWrapper.appendChild(utilitySection);

        // Auto-Fix Section
        const autoFixDiv = document.createElement('div');
        autoFixDiv.style.cssText = 'display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;';

        const autoFixBtn = createStyledButton('🔧 Auto-Fix Text');
        autoFixBtn.addEventListener('click', (e) => {
            e.preventDefault();
            applyAutoFix(lyricsTextarea);
        });

        const numberConvertBtn = createStyledButton('🔢 Convert Numbers');
        numberConvertBtn.addEventListener('click', (e) => {
            e.preventDefault();
            convertNumbersInteractive(lyricsTextarea);
        });

        autoFixDiv.appendChild(autoFixBtn);
        autoFixDiv.appendChild(numberConvertBtn);
        toolkitWrapper.appendChild(autoFixDiv);


        // Speed Controls
        const speedDiv = document.createElement('div');
        speedDiv.style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-bottom: 1rem;';
        const speedLabel = document.createElement('span');
        speedLabel.textContent = 'Speed:';
        speedLabel.style.fontWeight = 'bold';
        const speedDisplay = document.createElement('span');
        speedDisplay.id = 'gtt-speed-display';
        speedDisplay.textContent = '1.0x';
        speedDisplay.style.fontWeight = 'bold';
        const slowerBtn = createStyledButton('Slower');
        const fasterBtn = createStyledButton('Faster');

        slowerBtn.addEventListener('click', (e) => { e.preventDefault(); updatePlaybackSpeed(-0.25, speedDisplay); });
        fasterBtn.addEventListener('click', (e) => { e.preventDefault(); updatePlaybackSpeed(0.25, speedDisplay); });

        speedDiv.appendChild(speedLabel);
        speedDiv.appendChild(slowerBtn);
        speedDiv.appendChild(speedDisplay);
        speedDiv.appendChild(fasterBtn);
        toolkitWrapper.appendChild(speedDiv);

        // Stats
        const infoDiv = document.createElement('div');
        infoDiv.style.cssText = 'font-size: 0.8rem; color: #666; text-align: center;';
        infoDiv.innerHTML = `<b id="gtt-word-count">Words: 0</b> | <b id="gtt-char-count">Chars: 0</b><br>
                             Hotkeys: Ctrl+Space (Play), Ctrl+←/→ (Seek)`;
        toolkitWrapper.appendChild(infoDiv);

        const autoSaveStatus = document.createElement('div');
        autoSaveStatus.id = 'gtt-autosave-status';
        autoSaveStatus.style.cssText = 'text-align: center; font-size: 0.75rem; color: green; height: 1.2em; margin-top: 0.5rem;';
        toolkitWrapper.appendChild(autoSaveStatus);

        // Insert BEFORE the LyricsEditExplainer, not at the end
        const explainer = controlsContainer.querySelector('[class*="LyricsEditExplainer__Container-sc-"]');
        if (explainer) {
            controlsContainer.insertBefore(toolkitWrapper, explainer);
        } else {
            controlsContainer.appendChild(toolkitWrapper);
        }

        // Update stats
        const wordCountEl = document.getElementById('gtt-word-count');
        const charCountEl = document.getElementById('gtt-char-count');
        lyricsTextarea.addEventListener('input', () => {
            const text = lyricsTextarea.value;
            const words = text.trim().match(/\s+/g);
            wordCountEl.textContent = `Words: ${words ? words.length + 1 : (text.trim().length > 0 ? 1 : 0)}`;
            charCountEl.textContent = `Chars: ${text.length}`;

            // Em dash auto-conversion
            if (emDashMode && SETTINGS.emDashAuto) {
                const cursorPos = lyricsTextarea.selectionStart;
                const newText = text.replace(/(\w)-(\s)/g, '$1—$2');
                if (newText !== text) {
                    lyricsTextarea.value = newText;
                    lyricsTextarea.selectionStart = lyricsTextarea.selectionEnd = cursorPos;
                }
            }
        });
        lyricsTextarea.dispatchEvent(new Event('input'));
    }

    // --- Transcriber Dropdown Injection ---
    function injectTranscriberDropdown(lyricsTextarea) {
        const toolbarLeft = document.querySelector('.StickyContributorToolbar__Left-sc-bd5947d1-1');
        if (!toolbarLeft) {
            console.log('GTT V5: StickyContributorToolbar left section not found');
            return;
        }

        // Create dropdown container
        const dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'Dropdown__Container-sc-6beb7120-0 eUTivF';

        // Create toggle button
        const toggleButton = document.createElement('button');
        toggleButton.className = 'Dropdown__Toggle-sc-6beb7120-2 dZLcdU';

        // Create button content matching Admin button structure
        const buttonSpan = document.createElement('span');
        buttonSpan.className = 'SmallButton__Container-sc-fd351a33-0 KqsTp AdminMenu__Button-sc-f79fcf17-0 jUbdCt';

        const buttonText = document.createElement('span');
        buttonText.textContent = 'Transcriber Tools';

        const dropdownIcon = document.createElement('span');
        dropdownIcon.className = 'AdminMenu__DropdownIcon-sc-f79fcf17-2 bMMOin';
        dropdownIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 7"><path d="M4.488 7 0 0h8.977L4.488 7Z"></path></svg>';

        buttonSpan.appendChild(buttonText);
        buttonSpan.appendChild(dropdownIcon);
        toggleButton.appendChild(buttonSpan);

        // Create dropdown content container
        const contentContainer = document.createElement('div');
        contentContainer.className = 'Dropdown__ContentContainer-sc-6beb7120-1 gnvXRQ';
        contentContainer.style.display = 'none';

        // Create dropdown menu list
        const menuList = document.createElement('ul');
        menuList.className = 'AdminMenu__Dropdown-sc-f79fcf17-3 kHJiFV';

        // Create menu items
        const menuItems = [
            { text: '⚙️ Settings', action: () => openSettingsModal(lyricsTextarea) },
            { text: '📝 Custom Rules', action: () => openRulesModal(lyricsTextarea) },
            { text: '📚 Spelling Standardizer', action: () => standardizeSpellingInteractive(lyricsTextarea) },
            { text: '⠀ Zero-Width Space', action: () => {
                navigator.clipboard.writeText('\u200B');
                showNotification('Zero-width space copied!');
            }},
            { text: '— Em Dash Toggle', action: () => {
                emDashMode = !emDashMode;
                showNotification(emDashMode ? 'Em dash mode ON' : 'Em dash mode OFF');
            }}
        ];

        menuItems.forEach(item => {
            const listItem = document.createElement('li');
            listItem.className = 'AdminMenuItem__Container-sc-f1f20bba-0 tIvGF';

            const menuButton = document.createElement('button');
            menuButton.className = 'TextButton-sc-5aad70cc-0 hythMh AdminMenuItem__TextButton-sc-f1f20bba-1 egVwHf';
            menuButton.type = 'button';
            menuButton.textContent = item.text;

            menuButton.addEventListener('click', (e) => {
                e.preventDefault();
                item.action();
                contentContainer.style.display = 'none';
            });

            listItem.appendChild(menuButton);
            menuList.appendChild(listItem);
        });

        contentContainer.appendChild(menuList);
        dropdownContainer.appendChild(toggleButton);
        dropdownContainer.appendChild(contentContainer);

        // Add toggle functionality
        toggleButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const isVisible = contentContainer.style.display !== 'none';
            contentContainer.style.display = isVisible ? 'none' : 'block';
        });

        // Click outside to close
        document.addEventListener('click', (e) => {
            if (!dropdownContainer.contains(e.target)) {
                contentContainer.style.display = 'none';
            }
        });

        // Insert dropdown into toolbar
        toolbarLeft.appendChild(dropdownContainer);
    }

    // --- Auto-Fix Logic ---
    function applyAutoFix(textarea) {
        let text = textarea.value;
        const originalText = text;

        // Check for discontinued headers first
        const discontinuedHeaders = checkDiscontinuedHeaders(text);
        if (discontinuedHeaders.length > 0) {
            showDiscontinuedHeadersWarning(discontinuedHeaders, textarea);
            return;
        }

        if (SETTINGS.fixCapitalization) {
            text = fixCapitalization(text);
        }

        if (SETTINGS.fixContractions) {
            text = fixContractions(text);
        }

        if (SETTINGS.fixSlang) {
            text = fixSlang(text);
        }

        if (SETTINGS.fixFormatting) {
            text = fixFormatting(text);
        }

        // Apply custom rules
        customRules.forEach(rule => {
            if (rule.enabled) {
                try {
                    const regex = new RegExp(rule.find, 'g');
                    text = text.replace(regex, rule.replace);
                } catch (e) {
                    console.error('Error applying custom rule:', rule, e);
                }
            }
        });

        if (SETTINGS.detectBracketMismatch) {
            text = detectBracketMismatch(text);
        }

        if (text !== originalText) {
            textarea.value = text;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            showNotification('Auto-fix applied!');
        } else {
            showNotification('No changes needed!');
        }
    }

    function checkDiscontinuedHeaders(text) {
        const discontinuedPatterns = [
            { pattern: /\[Hook\]/gi, name: '[Hook]', replacement: '[Chorus] or [Refrain]' },
            { pattern: /\[Produced\s+By\]/gi, name: '[Produced By]', replacement: 'remove this header' },
            { pattern: /\[Sampling\]/gi, name: '[Sampling]', replacement: 'transcribe without header' },
            { pattern: /\[Scratches\]/gi, name: '[Scratches]', replacement: 'transcribe without header' },
            { pattern: /\[Ad\s+lib\]/gi, name: '[Ad lib]', replacement: 'transcribe without header' },
            { pattern: /\[Collision\]/gi, name: '[Collision]', replacement: 'transcribe without header' }
        ];

        const foundHeaders = [];
        discontinuedPatterns.forEach(({ pattern, name, replacement }) => {
            const matches = text.match(pattern);
            if (matches) {
                foundHeaders.push({
                    name: name,
                    count: matches.length,
                    replacement: replacement
                });
            }
        });

        return foundHeaders;
    }

    function showDiscontinuedHeadersWarning(headers, textarea) {
        const modal = createModal('Discontinued Headers Found', '600px');

        const headerList = headers.map(header =>
            `<li><strong>${header.name}</strong> (found ${header.count} time${header.count > 1 ? 's' : ''}) → ${header.replacement}</li>`
        ).join('');

        modal.content.innerHTML = `
            <div style="margin-bottom: 16px;">
                <p style="margin: 0 0 12px 0; color: #f44336; font-weight: bold;">
                    ⚠️ Discontinued Headers Detected
                </p>
                <p style="margin: 0 0 12px 0; color: #666;">
                    Genius no longer uses these headers. Please update them before using Auto-Fix:
                </p>
                <ul style="margin: 0 0 16px 0; padding-left: 20px; color: #333;">
                    ${headerList}
                </ul>
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 12px; margin-bottom: 16px;">
                    <p style="margin: 0; color: #856404; font-size: 14px;">
                        <strong>Note:</strong> [Hook] should be changed to [Chorus] or [Refrain] depending on the song structure.
                        Other discontinued headers should be removed entirely.
                    </p>
                </div>
            </div>
            <div style="display: flex; gap: 8px; justify-content: center; margin-top: 16px;">
                <button id="fix-headers" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Fix Headers
                </button>
                <button id="skip-fix" style="padding: 8px 16px; background: #ff9800; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Skip Auto-Fix
                </button>
                <button id="cancel-fix" style="padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Cancel
                </button>
            </div>
        `;

        const fixBtn = modal.content.querySelector('#fix-headers');
        const skipBtn = modal.content.querySelector('#skip-fix');
        const cancelBtn = modal.content.querySelector('#cancel-fix');

        fixBtn.addEventListener('click', () => {
            // Apply header fixes
            let text = textarea.value;
            text = text.replace(/\[Hook\]/gi, '[Chorus]');
            text = text.replace(/\[Produced\s+By\]/gi, '');
            text = text.replace(/\[Sampling\]/gi, '');
            text = text.replace(/\[Scratches\]/gi, '');
            text = text.replace(/\[Ad\s+lib\]/gi, '');
            text = text.replace(/\[Collision\]/gi, '');

            textarea.value = text;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
            modal.container.remove();

            // Now run auto-fix
            setTimeout(() => applyAutoFix(textarea), 100);
        });

        skipBtn.addEventListener('click', () => {
            modal.container.remove();
            // Run auto-fix anyway
            setTimeout(() => applyAutoFix(textarea), 100);
        });

        cancelBtn.addEventListener('click', () => {
            modal.container.remove();
        });

        document.body.appendChild(modal.container);
    }

    function fixCapitalization(text) {
        // Fix standalone "i" → "I"
        text = text.replace(/\bi\b/g, 'I');

        // Fix "ima", "imma", "i'mma" → "I'ma"
        text = text.replace(/\b(ima|imma|i'mma)\b/gi, "I'ma");

        // Capitalize first letter inside parentheses
        text = text.replace(/\(([a-z])/g, (match, letter) => `(${letter.toUpperCase()}`);

        // Capitalize first letter of each line
        text = text.split('\n').map(line => {
            if (line.trim().length > 0) {
                // Find the first non-whitespace character and capitalize it
                return line.replace(/^(\s*)([a-z])/, (match, whitespace, firstChar) => {
                    return whitespace + firstChar.toUpperCase();
                });
            }
            return line;
        }).join('\n');

        return text;
    }

    function fixContractions(text) {
        const contractions = {
            "dont": "don't", "cant": "can't", "wont": "won't", "isnt": "isn't",
            "arent": "aren't", "wasnt": "wasn't", "werent": "weren't",
            "hasnt": "hasn't", "havent": "haven't", "hadnt": "hadn't",
            "doesnt": "doesn't", "didnt": "didn't", "shouldnt": "shouldn't",
            "wouldnt": "wouldn't", "couldnt": "couldn't", "mustnt": "mustn't",
            "aint": "ain't", "yall": "y'all", "youre": "you're", "theyre": "they're",
            "were": "we're", "hes": "he's", "shes": "she's", "its": "it's",
            "thats": "that's", "whats": "what's", "hows": "how's", "wheres": "where's"
        };

        Object.entries(contractions).forEach(([wrong, correct]) => {
            const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
            text = text.replace(regex, (match) => {
                return match[0] === match[0].toUpperCase() ?
                    correct.charAt(0).toUpperCase() + correct.slice(1) : correct;
            });
        });

        // Context-aware: "were going" → "we're going"
        text = text.replace(/\bwere\s+(going|coming|taking|making|getting)/gi, "we're $1");

        // "its time" → "it's time" (possessive vs contraction)
        text = text.replace(/\bits\s+(time|been|not|all|like)/gi, "it's $1");

        return text;
    }

    function fixSlang(text) {
        const slangMap = {
            "sumn": "somethin'",
            "yuh": "yeah",
            "yea": "yeah",
            "skrt": "skrrt",
            "ok": "okay",
            "whoa": "woah",
            "hoe": "ho",
            "lil": "lil'",
        };

        Object.entries(slangMap).forEach(([slang, standard]) => {
            if (!WORD_WHITELIST.has(slang)) {
                const regex = new RegExp(`\\b${slang}\\b`, 'gi');
                text = text.replace(regex, standard);
            }
        });

        // Remove periods from abbreviations like V.I.P. → VIP
        text = text.replace(/\b([A-Z]\.){2,}/g, (match) => match.replace(/\./g, ''));

        return text;
    }

    function fixFormatting(text) {
        // Move parentheses outside formatting tags
        text = text.replace(/<b>\(([^)]+)\)<\/b>/g, '(<b>$1</b>)');
        text = text.replace(/<i>\(([^)]+)\)<\/i>/g, '(<i>$1</i>)');

        // Convert word-ending dashes to em dashes
        text = text.replace(/(\w)-(\s|$)/g, '$1—$2');

        // Remove multiple spaces
        text = text.replace(/  +/g, ' ');

        // Remove trailing whitespace
        text = text.split('\n').map(line => line.trimEnd()).join('\n');

        return text;
    }

    function detectBracketMismatch(text) {
        const brackets = { '(': ')', '[': ']', '{': '}' };
        const opening = Object.keys(brackets);
        const closing = Object.values(brackets);
        const stack = [];
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            for (const char of line) {
                if (opening.includes(char)) {
                    stack.push({ char, line: i, bracket: char });
                } else if (closing.includes(char)) {
                    if (stack.length === 0 || brackets[stack[stack.length - 1].char] !== char) {
                        // Mismatch detected
                        lines[i] = line + ' ⚠️';
                        break;
                    } else {
                        stack.pop();
                    }
                }
            }
        }

        // Mark lines with unclosed brackets
        stack.forEach(item => {
            if (!lines[item.line].includes('⚠️')) {
                lines[item.line] = lines[item.line] + ' ⚠️';
            }
        });

        return lines.join('\n');
    }

    // --- Spelling Standardization ---
    function standardizeSpellingInteractive(textarea) {
        const text = textarea.value;
        const corrections = [];

        // Define spelling corrections with context awareness
        const spellingRules = [
            // Standard spellings
            { find: /\bfoe\s*'?\s*n'?\s*'?\s*em\b/gi, replace: 'foenem', description: 'foe \'nem → foenem' },
            { find: /\bbro\s*'?\s*n'?\s*'?\s*em\b/gi, replace: 'bronem', description: 'bro \'nem → bronem' },
            { find: /\bsome'\b/gi, replace: 'somethin\'', description: 'some\' → somethin\'' },
            { find: /\bnone'\b/gi, replace: 'nothin\'', description: 'none\' → nothin\'' },
            { find: /\blow\b(?=\s+(?:for\s+)?location)/gi, replace: 'lo\'', description: 'low → lo\' (when referring to location)' },
            { find: /\bswitchey\b/gi, replace: 'switchy', description: 'switchey → switchy' },
            { find: /\bswitchie\b/gi, replace: 'switchies', description: 'switchie → switchies' },
            { find: /\bswitchys\b/gi, replace: 'switchies', description: 'switchys → switchies' },
            { find: /\bblickey\b/gi, replace: 'blicky', description: 'blickey → blicky' },
            { find: /\bblickie\b/gi, replace: 'blickies', description: 'blickie → blickies' },
            { find: /\bblickys\b/gi, replace: 'blickies', description: 'blickys → blickies' },
            { find: /\bcous'\b/gi, replace: 'cuz', description: 'cous\' → cuz' },
            { find: /\bT'ed\b/gi, replace: 'T\'d', description: 'T\'ed → T\'d' },
            { find: /\bTeed\b/gi, replace: 'T\'d', description: 'Teed → T\'d' },
            { find: /\bhoe\b(?![^a-z]*garden)/gi, replace: 'ho', description: 'hoe → ho (unless referring to garden hoe)' },
            { find: /\bdawg\b/gi, replace: 'dog', description: 'dawg → dog' },
            { find: /\bdawgy\b/gi, replace: 'doggy', description: 'dawgy → doggy' },
            { find: /\bslimey\b/gi, replace: 'slimy', description: 'slimey → slimy' },
            { find: /\bhigh\s+speed\b/gi, replace: 'high-speed', description: 'high speed → high-speed' },
            { find: /\be-way\b/gi, replace: 'E-way', description: 'e-way → E-way' },
            { find: /\beway\b/gi, replace: 'E-way', description: 'eway → E-way' },
            { find: /\bmunyun\b/gi, replace: 'monyun', description: 'munyun → monyun' },
            { find: /\bmon-yun\b/gi, replace: 'monyun', description: 'mon-yun → monyun' },

            // Firearms
            { find: /\bDrake\b/gi, replace: 'Draco', description: 'Drake → Draco' },
            { find: /\bDracey\b/gi, replace: 'Dracy', description: 'Dracey → Dracy' },
            { find: /\bDrakey\b/gi, replace: 'Dracy', description: 'Drakey → Dracy' },
            { find: /\bDrac-y\b/gi, replace: 'Dracy', description: 'Drac-y → Dracy' },
            { find: /\bmicro\s+Draco\b/gi, replace: 'Micro Draco', description: 'micro Draco → Micro Draco' },
            { find: /\bmini\s+Draco\b/gi, replace: 'Mini Draco', description: 'mini Draco → Mini Draco' },
            { find: /\bchoppa\b/gi, replace: 'chopper', description: 'choppa → chopper' },
            { find: /\bchop'\b/gi, replace: 'chop', description: 'chop\' → chop' },
            { find: /\bTec\b/gi, replace: 'TEC', description: 'Tec → TEC' },
            { find: /\bTEC9\b/gi, replace: 'TEC-9', description: 'TEC9 → TEC-9' },
            { find: /\bMac\b/gi, replace: 'MAC', description: 'Mac → MAC' },
            { find: /\bMAC10\b/gi, replace: 'MAC-10', description: 'MAC10 → MAC-10' },
            { find: /\bMAC11\b/gi, replace: 'MAC-11', description: 'MAC11 → MAC-11' },
            { find: /\bGlockys\b/gi, replace: 'Glockies', description: 'Glockys → Glockies' },
            { find: /\bG-Lock\b/gi, replace: 'G-lock', description: 'G-Lock → G-lock' },
            { find: /\bglizzys\b/gi, replace: 'glizzies', description: 'glizzys → glizzies' },
            { find: /\bGlock\s+nineteen\b/gi, replace: 'Glock 19', description: 'Glock nineteen → Glock 19' },
            { find: /\bgen\b/gi, replace: 'Gen', description: 'gen → Gen' },
            { find: /\bgen'\b/gi, replace: 'Gen', description: 'gen\' → Gen' },
            { find: /\bGen\s+1\s*\/\s*2\s*\/\s*3/gi, replace: 'Gen1/2/3', description: 'Gen 1 / 2 / 3 → Gen1/2/3' },
            { find: /\bF\s+and\s+N\b/gi, replace: 'F&N', description: 'F and N → F&N' },
            { find: /'\s*K\b/gi, replace: 'K', description: '\'K → K' },
            { find: /\bKelTec\b/gi, replace: 'Kel-Tec', description: 'KelTec → Kel-Tec' },
            { find: /\bKel-Tech\b/gi, replace: 'Kel-Tec', description: 'Kel-Tech → Kel-Tec' },
            { find: /\bSig\b/gi, replace: 'SIG', description: 'Sig → SIG' },
            { find: /\bRooger\b/gi, replace: 'Ruger', description: 'Rooger → Ruger' },
            { find: /\bSmith\s+&\s+Weston\b/gi, replace: 'Smith & Wesson', description: 'Smith & Weston → Smith & Wesson' },
            { find: /\bSmith\s+and\s+Wesson\b/gi, replace: 'Smith & Wesson', description: 'Smith and Wesson → Smith & Wesson' },
            { find: /\bSmith\s+N\s+Wesson\b/gi, replace: 'Smith & Wesson', description: 'Smith N Wesson → Smith & Wesson' },
            { find: /\bSmith\s+'n\b/gi, replace: 'Smith &', description: 'Smith \'n → Smith &' },
            { find: /\bM\s+and\s+P\b/gi, replace: 'M&P', description: 'M and P → M&P' },

            // Calibers
            { find: /\btwenty-two\b/gi, replace: '.22', description: 'twenty-two → .22' },
            { find: /\.57\b/gi, replace: '5.7', description: '.57 → 5.7' },
            { find: /\bfive-seven\b/gi, replace: '5.7', description: 'five-seven → 5.7' },
            { find: /\.9\b/gi, replace: '9', description: '.9 → 9' },
            { find: /\bnine\b(?=\s+(?:mil'|milli'))/gi, replace: '9', description: 'nine → 9 (when referring to caliber)' },
            { find: /\bthree-eighty\b/gi, replace: '.380', description: 'three-eighty → .380' },
            { find: /\bthirty-eight\b/gi, replace: '.38', description: 'thirty-eight → .38' },
            { find: /\bthirty-eight\s+Special\b/gi, replace: '.38 Special', description: 'thirty-eight Special → .38 Special' },
            { find: /\bforty\b(?=\s+(?:mil'|milli'))/gi, replace: '.40', description: 'forty → .40 (when referring to caliber)' },
            { find: /\bforty-five\b/gi, replace: '.45', description: 'forty-five → .45' },
            { find: /\bfour-five\b/gi, replace: '.45', description: 'four-five → .45' },
            { find: /\bthree-fifty-seven\b/gi, replace: '.357', description: 'three-fifty-seven → .357' },
            { find: /\.10\b/gi, replace: '10', description: '.10 → 10' },
            { find: /\bten\b(?=\s+(?:mil'|milli'))/gi, replace: '10', description: 'ten → 10 (when referring to caliber)' },
            { find: /\bforty-four\b/gi, replace: '.44', description: 'forty-four → .44' },
            { find: /\btwo-two-three\b/gi, replace: '.223', description: 'two-two-three → .223' },
            { find: /\.556\b/gi, replace: '5.56', description: '.556 → 5.56' },
            { find: /\bfive-five-six\b/gi, replace: '5.56', description: 'five-five-six → 5.56' },
            { find: /\bthree-hundred\b/gi, replace: '.300', description: 'three-hundred → .300' },
            { find: /\bthree-hundred\s+Blackout\b/gi, replace: '.300 Blackout', description: 'three-hundred Blackout → .300 Blackout' },
            { find: /\.762\b/gi, replace: '7.62', description: '.762 → 7.62' },
            { find: /\bseven-six-two\b/gi, replace: '7.62', description: 'seven-six-two → 7.62' },
            { find: /\bthree-o-eight\b/gi, replace: '.308', description: 'three-o-eight → .308' },
            { find: /\bthree-0-eight\b/gi, replace: '.308', description: 'three-0-eight → .308' },

            // Magazines
            { find: /\bmag'\b/gi, replace: 'mag', description: 'mag\' → mag' },
            { find: /\bKris\b/gi, replace: 'KRISS', description: 'Kris → KRISS' },
            { find: /\bkriss\s+vec\b/gi, replace: 'KRISS Vec\'', description: 'kriss vec → KRISS Vec\'' },
            { find: /\b30-round\b/gi, replace: 'thirty-round', description: '30-round → thirty-round' },
            { find: /\b50-round\b/gi, replace: 'fifty-round', description: '50-round → fifty-round' },
            { find: /\b100-round\b/gi, replace: 'hundred-round', description: '100-round → hundred-round' },

            // Jewelry
            { find: /\bPlain\s+Jane\b/gi, replace: 'plain jane', description: 'Plain Jane → plain jane' },
            { find: /\bplain\s+Jane\b/gi, replace: 'plain jane', description: 'plain Jane → plain jane' },
            { find: /\bprezi\b/gi, replace: 'presi', description: 'prezi → presi' },
            { find: /\bPrezi'\b/gi, replace: 'presi', description: 'Prezi\' → presi' },
            { find: /\bPresi'\b/gi, replace: 'presi', description: 'Presi\' → presi' },
            { find: /\bbustdown\b/gi, replace: 'bust down', description: 'bustdown → bust down' },
            { find: /\bbussdown\b/gi, replace: 'bust down', description: 'bussdown → bust down' },
            { find: /\bMilly\b/gi, replace: 'Rich Millie', description: 'Milly → Rich Millie' },
            { find: /\bRichy\b/gi, replace: 'Richie', description: 'Richy → Richie' },
            { find: /\bCarty\b/gi, replace: 'Carti\'', description: 'Carty → Carti\'' },
            { find: /\bRolley\b/gi, replace: 'Rollie', description: 'Rolley → Rollie' },
            { find: /\bAudemar\b/gi, replace: 'Audemars', description: 'Audemar → Audemars' },
            { find: /\bcuban\b/gi, replace: 'Cuban', description: 'cuban → Cuban' },
            { find: /\bjay\b/gi, replace: 'J', description: 'jay → J' },
            { find: /\bJ'\b/gi, replace: 'J', description: 'J\' → J' },
            { find: /\bBaguette\b/gi, replace: 'baguette', description: 'Baguette → baguette' },

            // Drugs
            { find: /\bXannie\b/gi, replace: 'Xanny', description: 'Xannie → Xanny' },
            { find: /\bXannys\b/gi, replace: 'Xannies', description: 'Xannys → Xannies' },
            { find: /\bPerk\b/gi, replace: 'Perc\'', description: 'Perk → Perc\'' },
            { find: /\byerk\b/gi, replace: 'yerc', description: 'yerk → yerc' },
            { find: /\bPercy\b/gi, replace: 'Perky', description: 'Percy → Perky' },
            { find: /\bPerkys\b/gi, replace: 'Perkies', description: 'Perkys → Perkies' },
            { find: /\bRoxys\b/gi, replace: 'Roxies', description: 'Roxys → Roxies' },
            { find: /\bOxys\b/gi, replace: 'Oxies', description: 'Oxys → Oxies' },
            { find: /\bAddies\b/gi, replace: 'Addys', description: 'Addies → Addys' },
            { find: /\bWockhart\b/gi, replace: 'Wockhardt', description: 'Wockhart → Wockhardt' },
            { find: /\bWockie\b/gi, replace: 'Wocky', description: 'Wockie → Wocky' },
            { find: /\bHi-Tec\b/gi, replace: 'Hi-Tech', description: 'Hi-Tec → Hi-Tech' },
            { find: /\bHigh\s+tech\b/gi, replace: 'Hi-Tech', description: 'High tech → Hi-Tech' },
            { find: /\bTus'\b/gi, replace: 'Tuss\'', description: 'Tus\' → Tuss\'' },
            { find: /\bTris'\b/gi, replace: 'Tris', description: 'Tris\' → Tris' },
            { find: /\bTrish\b/gi, replace: 'Tris', description: 'Trish → Tris' },
            { find: /\bActivis\b/gi, replace: 'Actavis', description: 'Activis → Actavis' },
            { find: /\bQuay\b/gi, replace: 'Qua\'', description: 'Quay → Qua\'' },
            { find: /\bZaZa\b/gi, replace: 'zaza', description: 'ZaZa → zaza' },
            { find: /'\s*za\b/gi, replace: 'za', description: '\'za → za' },
            { find: /\bwood\b(?=\s+(?:Backwood|backwood))/gi, replace: '\'Wood', description: 'wood → \'Wood (when referring to Backwood)' },
            { find: /\bMolly\b/gi, replace: 'molly', description: 'Molly → molly' },
            { find: /\bfetti\b/gi, replace: 'fetty', description: 'fetti → fetty' },
            { find: /\bextasy\b/gi, replace: 'ecstasy', description: 'extasy → ecstasy' },
            { find: /'\s*bowl\b/gi, replace: '\'bow', description: '\'bowl → \'bow' },
            { find: /\bRunts\b/gi, replace: 'Runtz', description: 'Runts → Runtz' },
            { find: /\bGrabber\b/gi, replace: 'Grabba', description: 'Grabber → Grabba' },

            // Vehicles
            { find: /\bSRT8\b/gi, replace: 'straight-eight', description: 'SRT8 → straight-eight' },
            { find: /\bskrate\b/gi, replace: 'straight', description: 'skrate → straight' },
            { find: /\bstraight8\b/gi, replace: 'straight-eight', description: 'straight8 → straight-eight' },
            { find: /\bRedEye\b/gi, replace: 'Redeye', description: 'RedEye → Redeye' },
            { find: /\bRed-eye\b/gi, replace: 'Redeye', description: 'Red-eye → Redeye' },
            { find: /\bthree-ninety-two\b/gi, replace: '392', description: 'three-ninety-two → 392' },
            { find: /\bsuburban\b/gi, replace: 'Suburban', description: 'suburban → Suburban' },
            { find: /\bBeamer\b/gi, replace: 'Bimmer', description: 'Beamer → Bimmer' },
            { find: /\bLamboh\b/gi, replace: 'Lambo\'', description: 'Lamboh → Lambo\'' },
            { find: /\brango\b/gi, replace: '\'Rango', description: 'rango → \'Rango' },
            { find: /\bKIA\b/gi, replace: 'Kia', description: 'KIA → Kia' },
            { find: /\bVete\b/gi, replace: '\'Vette', description: 'Vete → \'Vette' },
            { find: /\bVett\b/gi, replace: '\'Vette', description: 'Vett → \'Vette' },
            { find: /\bMayback\b/gi, replace: '\'Bach', description: 'Mayback → \'Bach' },
            { find: /\bHemy\b/gi, replace: 'Hemi', description: 'Hemy → Hemi' },
            { find: /\bHemies\b/gi, replace: 'Hemis', description: 'Hemies → Hemis' },
            { find: /\bScat'\b/gi, replace: 'Scat', description: 'Scat\' → Scat' },
            { find: /\bSkat\b/gi, replace: 'Scat', description: 'Skat → Scat' },
            { find: /\bTrackHawk\b/gi, replace: 'Trackhawk', description: 'TrackHawk → Trackhawk' },
            { find: /\bfin\s+fin\b/gi, replace: 'fin-fin', description: 'fin fin → fin-fin' },
            { find: /\bMazi\b/gi, replace: 'Masi', description: 'Mazi → Masi' },
            { find: /\bMasi'\b/gi, replace: 'Masi', description: 'Masi\' → Masi' },
            { find: /\bstoleo\b/gi, replace: 'stolo', description: 'stoleo → stolo' },
            { find: /\bstole-o\b/gi, replace: 'stolo', description: 'stole-o → stolo' },
            { find: /\bstoley\b/gi, replace: 'stolie', description: 'stoley → stolie' },

            // Ad-libs
            { find: /\bskrt\b/gi, replace: 'skrrt', description: 'skrt → skrrt' },
            { find: /\bpuw\b/gi, replace: 'pew', description: 'puw → pew' },
            { find: /\bgrah\b/gi, replace: 'grrah', description: 'grah → grrah' },
            { find: /\bbrah\b/gi, replace: 'brrah', description: 'brah → brrah' },
            { find: /\brah\b/gi, replace: 'rrah', description: 'rah → rrah' },
            { find: /\bbow\b/gi, replace: 'baow', description: 'bow → baow' },
            { find: /\bslat\b/gi, replace: 'slatt', description: 'slat → slatt' },
            { find: /\bglrr\b/gi, replace: 'grr', description: 'glrr → grr' },
            { find: /\bglrrt\b/gi, replace: 'grrt', description: 'glrrt → grrt' },
            { find: /\bblrr\b/gi, replace: 'brr', description: 'blrr → brr' },
            { find: /\bblrrt\b/gi, replace: 'brrt', description: 'blrrt → brrt' },
            { find: /\bflrr\b/gi, replace: 'frr', description: 'flrr → frr' },
            { find: /\bflrrt\b/gi, replace: 'frrt', description: 'flrrt → frrt' },
            { find: /\brrr\b/gi, replace: 'rr', description: 'rrr → rr' },
            { find: /\bmmm\b/gi, replace: 'mm', description: 'mmm → mm' },
            { find: /\bhmmm\b/gi, replace: 'hmm', description: 'hmmm → hmm' },
            { find: /\bmmm-hmmm\b/gi, replace: 'mm-hmm', description: 'mmm-hmmm → mm-hmm' },
            { find: /\bmmhmm\b/gi, replace: 'mhm', description: 'mmhmm → mhm' },
            { find: /\bnaa\b/gi, replace: 'nah', description: 'naa → nah' },
            { find: /\bnawh\b/gi, replace: 'naw', description: 'nawh → naw' },

            // Official standard spellings
            { find: /\bI'mma\b/gi, replace: 'I\'ma', description: 'I\'mma → I\'ma' },
            { find: /\bIma\b/gi, replace: 'I\'ma', description: 'Ima → I\'ma' },
            { find: /\bImma\b/gi, replace: 'I\'ma', description: 'Imma → I\'ma' },
            { find: /\bcause\b/gi, replace: '\'cause', description: 'cause → \'cause' },
            { find: /\bcos\b/gi, replace: '\'cause', description: 'cos → \'cause' },
            { find: /\bcuz\b/gi, replace: '\'cause', description: 'cuz → \'cause' },
            { find: /\bok\b/gi, replace: 'okay', description: 'ok → okay' },
            { find: /\bO\.K\.\b/gi, replace: 'okay', description: 'O.K. → okay' },
            { find: /\bK\b(?=\s+(?:okay|alright))/gi, replace: 'okay', description: 'K → okay' },
            { find: /\btil\b/gi, replace: '\'til', description: 'til → \'til' },
            { find: /\btrynna\b/gi, replace: 'tryna', description: 'trynna → tryna' },
            { find: /\baye\b/gi, replace: 'ayy', description: 'aye → ayy' },
            { find: /\bay\b/gi, replace: 'ayy', description: 'ay → ayy' },
            { find: /\bya'll\b/gi, replace: 'y\'all', description: 'ya\'ll → y\'all' },
            { find: /\bboujee\b/gi, replace: 'bougie', description: 'boujee → bougie' },
            { find: /\bboujie\b/gi, replace: 'bougie', description: 'boujie → bougie' },
            { find: /\blil\b/gi, replace: 'lil\'', description: 'lil → lil\'' },
            { find: /\bli'l\b/gi, replace: 'lil\'', description: 'li\'l → lil\'' },
            { find: /\bwhoa\b/gi, replace: 'woah', description: 'whoa → woah' },

            // Times
            { find: /\bFive\s+thirty\b/gi, replace: '5:30', description: 'Five thirty → 5:30' },
            { find: /\bFive-thirty\b/gi, replace: '5:30', description: 'Five-thirty → 5:30' },
            { find: /\b8:00\s+a\.m\.\b/gi, replace: '8 a.m.', description: '8:00 a.m. → 8 a.m.' },
            { find: /\b8\s+am\b/gi, replace: '8 a.m.', description: '8 am → 8 a.m.' },
            { find: /\b8\s+AM\b/gi, replace: '8 a.m.', description: '8 AM → 8 a.m.' },
            { find: /\b8\s+A\.M\.\b/gi, replace: '8 a.m.', description: '8 A.M. → 8 a.m.' },
            { find: /\b7:45\s+pm\b/gi, replace: '7:45 p.m.', description: '7:45 pm → 7:45 p.m.' },
            { find: /\b7:45\s+PM\b/gi, replace: '7:45 p.m.', description: '7:45 PM → 7:45 p.m.' },
            { find: /\b7:45\s+P\.M\.\b/gi, replace: '7:45 p.m.', description: '7:45 P.M. → 7:45 p.m.' },
            { find: /\bsix\s+o'clock\b/gi, replace: '6 o\'clock', description: 'six o\'clock → 6 o\'clock' },
            { find: /\b6\s+O'clock\b/gi, replace: '6 o\'clock', description: '6 O\'clock → 6 o\'clock' },

            // Years and numbers
            { find: /\btwenty-fourteen\b/gi, replace: '2014', description: 'twenty-fourteen → 2014' },
            { find: /\btwelve\b(?=\s+(?:police|cops|officers))/gi, replace: '12', description: 'twelve → 12 (when referring to police)' },
            { find: /\b10\s+K\b/gi, replace: '10K', description: '10 K → 10K' },
            { find: /\bten\s+K\b/gi, replace: '10K', description: 'ten K → 10K' },
            { find: /\bGang\s+K\b/gi, replace: 'GangK', description: 'Gang K → GangK' },
            { find: /\bName\s+K\b/gi, replace: 'NameK', description: 'Name K → NameK' }
        ];

        // Find all potential corrections
        spellingRules.forEach(rule => {
            const regex = new RegExp(rule.find.source, 'gi');
            let match;
            while ((match = regex.exec(text)) !== null) {
                corrections.push({
                    original: match[0],
                    corrected: rule.replace,
                    description: rule.description,
                    index: match.index
                });
            }
        });

        if (corrections.length === 0) {
            showNotification('No spelling corrections needed!');
            return;
        }

        processNextSpellingCorrection(textarea, corrections, 0);
    }

    function processNextSpellingCorrection(textarea, corrections, currentIndex) {
        if (currentIndex >= corrections.length) {
            showNotification('Spelling standardization complete!');
            return;
        }

        const correction = corrections[currentIndex];

        showSpellingCorrectionModal(
            correction.original,
            correction.corrected,
            correction.description,
            () => {
                // Yes - apply this correction
                const text = textarea.value;
                textarea.value = text.substring(0, correction.index) + correction.corrected +
                               text.substring(correction.index + correction.original.length);
                textarea.dispatchEvent(new Event('input', { bubbles: true }));

                // Update indices for remaining corrections
                const diff = correction.corrected.length - correction.original.length;
                for (let i = currentIndex + 1; i < corrections.length; i++) {
                    corrections[i].index += diff;
                }

                processNextSpellingCorrection(textarea, corrections, currentIndex + 1);
            },
            () => {
                // No - skip this correction
                processNextSpellingCorrection(textarea, corrections, currentIndex + 1);
            },
            () => {
                // No to all
                showNotification('Spelling standardization cancelled');
            }
        );
    }

    function showSpellingCorrectionModal(original, corrected, description, onYes, onNo, onNoToAll) {
        const modal = createModal('Spelling Correction?', '500px');

        modal.content.innerHTML = `
            <div style="text-align: center; font-size: 16px; margin: 20px 0;">
                <div style="margin-bottom: 10px; color: #666;">${description}</div>
                <div style="background: #f0f0f0; padding: 15px; border-radius: 4px; margin: 10px 0;">
                    <div style="font-size: 18px; margin-bottom: 8px;">Found:</div>
                    <strong style="font-size: 20px; color: #f44336;">"${original}"</strong>
                    <div style="margin: 10px 0;">↓</div>
                    <div style="font-size: 18px; margin-bottom: 8px;">Correct to:</div>
                    <strong style="font-size: 20px; color: #4CAF50;">"${corrected}"</strong>
                </div>
            </div>
            <div style="display: flex; gap: 8px; justify-content: center; margin-top: 20px;">
                <button id="spell-yes" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                    Yes (Y)
                </button>
                <button id="spell-no" style="padding: 10px 20px; background: #ff9800; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                    No (N)
                </button>
                <button id="spell-no-all" style="padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                    No to All (A)
                </button>
            </div>
        `;

        const yesBtn = modal.content.querySelector('#spell-yes');
        const noBtn = modal.content.querySelector('#spell-no');
        const noAllBtn = modal.content.querySelector('#spell-no-all');

        yesBtn.addEventListener('click', () => {
            modal.container.remove();
            onYes();
        });

        noBtn.addEventListener('click', () => {
            modal.container.remove();
            onNo();
        });

        noAllBtn.addEventListener('click', () => {
            modal.container.remove();
            onNoToAll();
        });

        // Keyboard shortcuts
        const keyHandler = (e) => {
            if (e.key === 'y' || e.key === 'Y') {
                yesBtn.click();
                document.removeEventListener('keydown', keyHandler);
            } else if (e.key === 'n' || e.key === 'N') {
                noBtn.click();
                document.removeEventListener('keydown', keyHandler);
            } else if (e.key === 'a' || e.key === 'A') {
                noAllBtn.click();
                document.removeEventListener('keydown', keyHandler);
            }
        };
        document.addEventListener('keydown', keyHandler);

        document.body.appendChild(modal.container);
    }

    // --- Number Conversion ---
    function convertNumbersInteractive(textarea) {
        numberConversionSkipList.clear();
        const text = textarea.value;
        const numberRegex = /\b(\d+)(s)?\b/g;
        const matches = [];
        let match;

        while ((match = numberRegex.exec(text)) !== null) {
            const num = match[1];
            const plural = match[2] || '';

            // Skip whitelisted numbers
            if (NUMBER_WHITELIST.has(num) || NUMBER_WHITELIST.has(num + plural)) {
                continue;
            }

            // Skip URLs, dates, etc.
            const before = text.substring(Math.max(0, match.index - 10), match.index);
            const after = text.substring(match.index + match[0].length, match.index + match[0].length + 10);
            if (before.includes('http') || before.includes('/') || after.includes('/') ||
                /\d{4}/.test(num) || // Skip years
                before.match(/\d+:/) || after.match(/:\d+/)) { // Skip timestamps
                continue;
            }

            matches.push({
                original: match[0],
                number: num,
                plural: plural,
                index: match.index
            });
        }

        if (matches.length === 0) {
            showNotification('No convertible numbers found!');
            return;
        }

        processNextNumber(textarea, matches, 0);
    }

    function processNextNumber(textarea, matches, currentIndex) {
        if (currentIndex >= matches.length) {
            showNotification('Number conversion complete!');
            return;
        }

        const match = matches[currentIndex];
        const converted = numberToText(match.number) + (match.plural ? 's' : '');

        if (numberConversionSkipList.has(match.original)) {
            processNextNumber(textarea, matches, currentIndex + 1);
            return;
        }

        showNumberConversionModal(
            match.original,
            converted,
            () => {
                // Yes - convert this one
                const text = textarea.value;
                textarea.value = text.substring(0, match.index) + converted +
                               text.substring(match.index + match.original.length);
                textarea.dispatchEvent(new Event('input', { bubbles: true }));

                // Update indices for remaining matches
                const diff = converted.length - match.original.length;
                for (let i = currentIndex + 1; i < matches.length; i++) {
                    matches[i].index += diff;
                }

                processNextNumber(textarea, matches, currentIndex + 1);
            },
            () => {
                // No - skip this one
                processNextNumber(textarea, matches, currentIndex + 1);
            },
            () => {
                // No to all
                showNotification('Conversion cancelled');
            }
        );
    }

    function numberToText(num) {
        const n = parseInt(num);

        if (NUMBER_MAP[num]) {
            return NUMBER_MAP[num];
        }

        if (n < 20) return NUMBER_MAP[num];
        if (n < 100) {
            const tens = Math.floor(n / 10) * 10;
            const ones = n % 10;
            return ones === 0 ? NUMBER_MAP[tens.toString()] :
                   NUMBER_MAP[tens.toString()] + '-' + NUMBER_MAP[ones.toString()];
        }

        return num; // Return original if can't convert
    }

    // --- Text Selection Formatting ---
    let formatPopup = null;

    function attachTextSelectionListener(textarea) {
        textarea.addEventListener('mouseup', () => handleTextSelection(textarea));
        textarea.addEventListener('keyup', () => handleTextSelection(textarea));
    }

    function handleTextSelection(textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;

        if (start === end) {
            hideFormatPopup();
            return;
        }

        showFormatPopup(textarea, start, end);
    }

    function showFormatPopup(textarea, start, end) {
        hideFormatPopup();

        formatPopup = document.createElement('div');
        formatPopup.style.cssText = `
            position: absolute;
            background: #333;
            color: white;
            padding: 8px;
            border-radius: 4px;
            display: flex;
            gap: 8px;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;

        const boldBtn = createPopupButton('B', () => toggleFormatting(textarea, start, end, 'b'));
        const italicBtn = createPopupButton('I', () => toggleFormatting(textarea, start, end, 'i'));

        formatPopup.appendChild(boldBtn);
        formatPopup.appendChild(italicBtn);

        document.body.appendChild(formatPopup);

        // Position near textarea
        const rect = textarea.getBoundingClientRect();
        formatPopup.style.left = (rect.left + 10) + 'px';
        formatPopup.style.top = (rect.top - 40) + 'px';
    }

    function hideFormatPopup() {
        if (formatPopup) {
            formatPopup.remove();
            formatPopup = null;
        }
    }

    function createPopupButton(text, onClick) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.style.cssText = `
            background: transparent;
            border: 1px solid white;
            color: white;
            padding: 4px 8px;
            cursor: pointer;
            border-radius: 2px;
            font-weight: bold;
        `;
        btn.addEventListener('click', onClick);
        return btn;
    }

    function toggleFormatting(textarea, start, end, tag) {
        const selectedText = textarea.value.substring(start, end);
        const openTag = `<${tag}>`;
        const closeTag = `</${tag}>`;

        let newText;
        if (selectedText.startsWith(openTag) && selectedText.endsWith(closeTag)) {
            // Remove formatting
            newText = selectedText.substring(openTag.length, selectedText.length - closeTag.length);
        } else {
            // Add formatting
            newText = openTag + selectedText + closeTag;
        }

        textarea.value = textarea.value.substring(0, start) + newText + textarea.value.substring(end);
        textarea.selectionStart = start;
        textarea.selectionEnd = start + newText.length;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));

        hideFormatPopup();
    }

    // --- Settings Modal ---
    function openSettingsModal(textarea) {
        const modal = createModal('Settings');

        const settingsHTML = `
            <div style="display: flex; flex-direction: column; gap: 12px;">
                ${createCheckbox('autoFixEnabled', 'Enable Auto-Fix')}
                ${createCheckbox('fixCapitalization', 'Fix Capitalization')}
                ${createCheckbox('fixContractions', 'Fix Contractions')}
                ${createCheckbox('fixSlang', 'Fix Slang & Standardization')}
                ${createCheckbox('fixFormatting', 'Fix Formatting & Punctuation')}
                ${createCheckbox('convertNumbers', 'Convert Numbers (Interactive)')}
                ${createCheckbox('detectBracketMismatch', 'Detect Bracket Mismatches')}
                ${createCheckbox('emDashAuto', 'Auto Em Dash Conversion')}
            </div>
        `;

        modal.content.innerHTML = settingsHTML;

        // Add save button
        const saveBtn = createStyledButton('Save Settings');
        saveBtn.style.marginTop = '16px';
        saveBtn.addEventListener('click', () => {
            Object.keys(DEFAULT_SETTINGS).forEach(key => {
                const checkbox = modal.content.querySelector(`#setting-${key}`);
                if (checkbox) {
                    SETTINGS[key] = checkbox.checked;
                }
            });
            saveSettings(SETTINGS);
            showNotification('Settings saved!');
            modal.container.remove();
        });
        modal.content.appendChild(saveBtn);

        document.body.appendChild(modal.container);
    }

    function createCheckbox(id, label) {
        return `
            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <input type="checkbox" id="setting-${id}" ${SETTINGS[id] ? 'checked' : ''}
                       style="width: 18px; height: 18px; cursor: pointer;">
                <span>${label}</span>
            </label>
        `;
    }

    // --- Custom Rules Modal ---
    function openRulesModal(textarea) {
        const modal = createModal('Custom Regex Rules', '600px');

        const rulesContainer = document.createElement('div');
        rulesContainer.style.cssText = 'max-height: 400px; overflow-y: auto; margin-bottom: 16px;';

        function renderRules() {
            rulesContainer.innerHTML = '';
            customRules.forEach((rule, index) => {
                const ruleDiv = document.createElement('div');
                ruleDiv.style.cssText = `
                    background: #f5f5f5;
                    padding: 12px;
                    margin-bottom: 8px;
                    border-radius: 4px;
                    border-left: 3px solid ${rule.enabled ? '#4CAF50' : '#ccc'};
                `;

                ruleDiv.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                        <div style="flex: 1;">
                            <strong>${rule.description || 'Rule ' + (index + 1)}</strong>
                            <div style="font-size: 0.85em; color: #666; margin-top: 4px;">
                                Find: <code>${rule.find}</code><br>
                                Replace: <code>${rule.replace}</code>
                            </div>
                        </div>
                        <div style="display: flex; gap: 4px;">
                            <button class="toggle-rule" data-index="${index}"
                                    style="padding: 4px 8px; cursor: pointer; background: ${rule.enabled ? '#4CAF50' : '#ccc'}; border: none; border-radius: 3px; color: white;">
                                ${rule.enabled ? 'ON' : 'OFF'}
                            </button>
                            <button class="delete-rule" data-index="${index}"
                                    style="padding: 4px 8px; cursor: pointer; background: #f44336; border: none; border-radius: 3px; color: white;">
                                Delete
                            </button>
                        </div>
                    </div>
                `;

                rulesContainer.appendChild(ruleDiv);
            });

            // Attach event listeners
            modal.content.querySelectorAll('.toggle-rule').forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.dataset.index);
                    customRules[index].enabled = !customRules[index].enabled;
                    saveCustomRules(customRules);
                    renderRules();
                });
            });

            modal.content.querySelectorAll('.delete-rule').forEach(btn => {
                btn.addEventListener('click', () => {
                    const index = parseInt(btn.dataset.index);
                    if (confirm('Delete this rule?')) {
                        customRules.splice(index, 1);
                        saveCustomRules(customRules);
                        renderRules();
                    }
                });
            });
        }

        renderRules();
        modal.content.appendChild(rulesContainer);

        // Add new rule form
        const formDiv = document.createElement('div');
        formDiv.style.cssText = 'border-top: 1px solid #ccc; padding-top: 16px; margin-top: 16px;';
        formDiv.innerHTML = `
            <h4 style="margin-bottom: 8px;">Add New Rule</h4>
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <input type="text" id="rule-description" placeholder="Description (optional)"
                       style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                <input type="text" id="rule-find" placeholder="Find (regex pattern)"
                       style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                <input type="text" id="rule-replace" placeholder="Replace with"
                       style="padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
            </div>
        `;
        modal.content.appendChild(formDiv);

        // Buttons
        const btnDiv = document.createElement('div');
        btnDiv.style.cssText = 'display: flex; gap: 8px; margin-top: 16px;';

        const addBtn = createStyledButton('Add Rule');
        addBtn.addEventListener('click', () => {
            const description = modal.content.querySelector('#rule-description').value;
            const find = modal.content.querySelector('#rule-find').value;
            const replace = modal.content.querySelector('#rule-replace').value;

            if (!find) {
                alert('Find pattern is required!');
                return;
            }

            try {
                new RegExp(find); // Test if valid regex
                customRules.push({ description, find, replace, enabled: true });
                saveCustomRules(customRules);
                renderRules();
                modal.content.querySelector('#rule-description').value = '';
                modal.content.querySelector('#rule-find').value = '';
                modal.content.querySelector('#rule-replace').value = '';
                showNotification('Rule added!');
            } catch (e) {
                alert('Invalid regex pattern: ' + e.message);
            }
        });

        const exportBtn = createStyledButton('Export Rules');
        exportBtn.addEventListener('click', () => {
            const json = JSON.stringify(customRules, null, 2);
            navigator.clipboard.writeText(json);
            showNotification('Rules copied to clipboard!');
        });

        const importBtn = createStyledButton('Import Rules');
        importBtn.addEventListener('click', () => {
            const json = prompt('Paste JSON rules:');
            if (json) {
                try {
                    const imported = JSON.parse(json);
                    if (Array.isArray(imported)) {
                        customRules = imported;
                        saveCustomRules(customRules);
                        renderRules();
                        showNotification('Rules imported!');
                    } else {
                        alert('Invalid JSON format');
                    }
                } catch (e) {
                    alert('Error parsing JSON: ' + e.message);
                }
            }
        });

        btnDiv.appendChild(addBtn);
        btnDiv.appendChild(exportBtn);
        btnDiv.appendChild(importBtn);
        modal.content.appendChild(btnDiv);

        document.body.appendChild(modal.container);
    }

    // --- Number Conversion Modal ---
    function showNumberConversionModal(original, converted, onYes, onNo, onNoToAll) {
        const modal = createModal('Convert Number?', '400px');

        modal.content.innerHTML = `
            <div style="text-align: center; font-size: 18px; margin: 20px 0;">
                <div style="margin-bottom: 10px;">Convert:</div>
                <div style="background: #f0f0f0; padding: 15px; border-radius: 4px; margin: 10px 0;">
                    <strong style="font-size: 24px;">${original}</strong>
                    <div style="margin: 10px 0;">↓</div>
                    <strong style="font-size: 24px; color: #4CAF50;">${converted}</strong>
                </div>
            </div>
            <div style="display: flex; gap: 8px; justify-content: center; margin-top: 20px;">
                <button id="conv-yes" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                    Yes (Y)
                </button>
                <button id="conv-no" style="padding: 10px 20px; background: #ff9800; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                    No (N)
                </button>
                <button id="conv-no-all" style="padding: 10px 20px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                    No to All (A)
                </button>
            </div>
        `;

        const yesBtn = modal.content.querySelector('#conv-yes');
        const noBtn = modal.content.querySelector('#conv-no');
        const noAllBtn = modal.content.querySelector('#conv-no-all');

        yesBtn.addEventListener('click', () => {
            modal.container.remove();
            onYes();
        });

        noBtn.addEventListener('click', () => {
            numberConversionSkipList.add(original);
            modal.container.remove();
            onNo();
        });

        noAllBtn.addEventListener('click', () => {
            modal.container.remove();
            onNoToAll();
        });

        // Keyboard shortcuts
        const keyHandler = (e) => {
            if (e.key === 'y' || e.key === 'Y') {
                yesBtn.click();
                document.removeEventListener('keydown', keyHandler);
            } else if (e.key === 'n' || e.key === 'N') {
                noBtn.click();
                document.removeEventListener('keydown', keyHandler);
            } else if (e.key === 'a' || e.key === 'A') {
                noAllBtn.click();
                document.removeEventListener('keydown', keyHandler);
            }
        };
        document.addEventListener('keydown', keyHandler);

        document.body.appendChild(modal.container);
    }

    // --- Helper Functions ---

    function createSection(title, buttons, textarea) {
        const sectionDiv = document.createElement('div');
        sectionDiv.style.cssText = 'display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem;';
        buttons.forEach(btnConfig => {
            const btn = createStyledButton(btnConfig.text);
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (btnConfig.action) {
                    btnConfig.action(textarea);
                } else if (btnConfig.isCounter) {
                    insertTextAtCursor(textarea, `${btnConfig.insert.slice(0, -1)} ${btnConfig.counter()}]\n`);
                } else {
                    insertTextAtCursor(textarea, `${btnConfig.insert}\n`);
                }
            });
            sectionDiv.appendChild(btn);
        });
        return sectionDiv;
    }

    function createStyledButton(text) {
        const button = document.createElement('button');
        button.textContent = text;
        button.type = 'button';

        const nativeButton = document.querySelector('[class*="SmallButton__Container-sc-"]') ||
                            document.querySelector('button[class*="LyricsEdit-desktop__Button-sc-"]');
        if (nativeButton) {
            button.className = nativeButton.className;
        } else {
            button.style.cssText = 'background-color: transparent; border: 1px solid #000; color: #000; padding: 4px 8px; border-radius: 1rem; cursor: pointer;';
        }
        button.style.marginBottom = '0';
        button.style.width = 'auto';
        button.style.backgroundColor = 'transparent';
        button.style.color = '#000';
        button.style.border = '1px solid #000';
        return button;
    }

    function createModal(title, width = '500px') {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        const modalDiv = document.createElement('div');
        modalDiv.style.cssText = `
            background: white;
            padding: 24px;
            border-radius: 8px;
            max-width: ${width};
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            position: relative;
        `;

        const header = document.createElement('div');
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;';

        const titleEl = document.createElement('h2');
        titleEl.textContent = title;
        titleEl.style.margin = '0';

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            background: transparent;
            border: none;
            font-size: 28px;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            line-height: 1;
        `;
        closeBtn.addEventListener('click', () => overlay.remove());

        header.appendChild(titleEl);
        header.appendChild(closeBtn);
        modalDiv.appendChild(header);

        const content = document.createElement('div');
        modalDiv.appendChild(content);

        overlay.appendChild(modalDiv);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });

        return { container: overlay, content: content };
    }

    function insertTextAtCursor(textarea, text) {
        textarea.focus();
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        document.execCommand('insertText', false, text);
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function findMediaElement() {
        // Try different selectors for media elements, prioritizing YouTube video
        const selectors = [
            '.video-stream.html5-main-video', // YouTube specific
            '.html5-main-video', // YouTube main video
            '.video-stream', // YouTube video stream
            'video', // Generic video
            'audio' // Generic audio
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element;
            }
        }

        return null;
    }

    function insertTimestamp(textarea) {
        const media = findMediaElement();
        if (media && media.currentTime !== undefined) {
            const time = media.currentTime;
            const minutes = Math.floor(time / 60);
            const seconds = Math.floor(time % 60).toString().padStart(2, '0');
            insertTextAtCursor(textarea, `[${minutes}:${seconds}] `);
        } else {
            alert('Could not find media player to get current time.');
        }
    }

    function insertArtistName(textarea) {
        // Try to get artists from the song header credit list
        const creditList = document.querySelector('.SongHeader-desktop__CreditList-sc-e33a5cab-16');
        if (creditList) {
            const artistLinks = creditList.querySelectorAll('a[class*="StyledLink-sc-"]');
            const artists = Array.from(artistLinks).map(link => link.textContent.trim());

            if (artists.length > 0) {
                if (artists.length === 1) {
                    // Single artist - show selection modal for section type
                    showArtistSelectionModal(textarea, artists);
                } else {
                    // Multiple artists - show selection modal
                    showArtistSelectionModal(textarea, artists);
                }
                return;
            }
        }

        // Fallback: try to get primary artist from header
        const artistName = document.querySelector('a[class*="HeaderWithCoverArt__PrimaryArtist-sc-"]')?.textContent.trim();
        if (artistName) {
            insertTextAtCursor(textarea, `[${artistName}]`);
        } else {
            alert('Could not automatically detect any artist names.');
        }
    }

    function showArtistSelectionModal(textarea, artists) {
        const modal = createModal('Select Singing Artists', '600px');

        modal.content.innerHTML = `
            <div style="margin-bottom: 16px;">
                <p style="margin: 0 0 12px 0; color: #666;">Found ${artists.length} artists. Which ones are singing?</p>

                <div style="margin-bottom: 12px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold;">Section Type:</label>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px;">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="radio" name="section-type" value="verse" checked style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Verse</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="radio" name="section-type" value="chorus" style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Chorus</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="radio" name="section-type" value="pre-chorus" style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Pre-Chorus</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="radio" name="section-type" value="post-chorus" style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Post-Chorus</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="radio" name="section-type" value="bridge" style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Bridge</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="radio" name="section-type" value="breakdown" style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Breakdown</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="radio" name="section-type" value="intro" style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Intro</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="radio" name="section-type" value="outro" style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Outro</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="radio" name="section-type" value="interlude" style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Interlude</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="radio" name="section-type" value="refrain" style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Refrain</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="radio" name="section-type" value="instrumental" style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Instrumental</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="radio" name="section-type" value="skit" style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Skit</span>
                        </label>
                    </div>
                </div>

                <div style="margin-bottom: 12px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold;">Artist Selection:</label>
                    <div style="max-height: 200px; overflow-y: auto; border: 1px solid #e0e0e0; border-radius: 4px; padding: 8px;">
                        ${artists.map((artist, index) => `
                            <label style="display: flex; align-items: center; gap: 8px; padding: 6px 0; cursor: pointer;">
                                <input type="checkbox" id="artist-${index}" checked style="width: 18px; height: 18px; cursor: pointer;">
                                <span>${artist}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div style="margin-bottom: 12px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: bold;">Special Identifiers:</label>
                    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" id="use-both" style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Add "Both"</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px;">
                            <input type="checkbox" id="use-all" style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Add "All"</span>
                        </label>
                    </div>
                </div>

                <div style="background: #f5f5f5; padding: 8px; border-radius: 4px; font-size: 12px; color: #666;">
                    <strong>Formatting:</strong> 1st artist (normal), 2nd artist (<i>italics</i>), 3rd artist (<b>bold</b>), 4th artist (<i><b>bold italics</b></i>)
                </div>
            </div>
            <div style="display: flex; gap: 8px; justify-content: center; margin-top: 16px;">
                <button id="artist-all" style="padding: 8px 16px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    All Artists
                </button>
                <button id="artist-selected" style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Selected Only
                </button>
                <button id="artist-cancel" style="padding: 8px 16px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
                    Cancel
                </button>
            </div>
        `;

        const allBtn = modal.content.querySelector('#artist-all');
        const selectedBtn = modal.content.querySelector('#artist-selected');
        const cancelBtn = modal.content.querySelector('#artist-cancel');

        function getSectionType() {
            const selectedRadio = modal.content.querySelector('input[name="section-type"]:checked');
            return selectedRadio ? selectedRadio.value : 'verse';
        }

        function formatArtistText(artistList) {
            const sectionType = getSectionType();
            const useBoth = modal.content.querySelector('#use-both').checked;
            const useAll = modal.content.querySelector('#use-all').checked;

            // Apply formatting based on Genius rules
            const formattedArtists = artistList.map((artist, index) => {
                if (index === 0) return artist; // First artist: no formatting
                if (index === 1) return `<i>${artist}</i>`; // Second artist: italics
                if (index === 2) return `<b>${artist}</b>`; // Third artist: bold
                if (index === 3) return `<i><b>${artist}</b></i>`; // Fourth artist: bold italics
                return artist; // Beyond 4 artists, no formatting
            });

            // Add special identifiers if selected
            if (useBoth && artistList.length >= 2) {
                formattedArtists.push('<b>Both</b>');
            }
            if (useAll && artistList.length >= 3) {
                formattedArtists.push('<b><i>All</i></b>');
            }

            // Join with commas and ampersand
            let artistText;
            if (formattedArtists.length <= 2) {
                artistText = formattedArtists.join(' & ');
            } else {
                artistText = formattedArtists.slice(0, -1).join(', ') + ' & ' + formattedArtists[formattedArtists.length - 1];
            }

            // Format section header
            if (sectionType === 'verse') {
                return `[Verse ${verseCounter}: ${artistText}]`;
            } else if (sectionType === 'chorus') {
                return `[Chorus ${chorusCounter}: ${artistText}]`;
            } else if (sectionType === 'pre-chorus') {
                return `[Pre-Chorus: ${artistText}]`;
            } else if (sectionType === 'post-chorus') {
                return `[Post-Chorus: ${artistText}]`;
            } else {
                return `[${sectionType.charAt(0).toUpperCase() + sectionType.slice(1)}: ${artistText}]`;
            }
        }

        allBtn.addEventListener('click', () => {
            const formattedText = formatArtistText(artists);
            insertTextAtCursor(textarea, formattedText);

            // Increment counters if needed
            const sectionType = getSectionType();
            if (sectionType === 'verse') verseCounter++;
            if (sectionType === 'chorus') chorusCounter++;

            modal.container.remove();
        });

        selectedBtn.addEventListener('click', () => {
            const selectedArtists = [];
            artists.forEach((artist, index) => {
                const checkbox = modal.content.querySelector(`#artist-${index}`);
                if (checkbox.checked) {
                    selectedArtists.push(artist);
                }
            });

            if (selectedArtists.length > 0) {
                const formattedText = formatArtistText(selectedArtists);
                insertTextAtCursor(textarea, formattedText);

                // Increment counters if needed
                const sectionType = getSectionType();
                if (sectionType === 'verse') verseCounter++;
                if (sectionType === 'chorus') chorusCounter++;
            }
            modal.container.remove();
        });

        cancelBtn.addEventListener('click', () => {
            modal.container.remove();
        });

        document.body.appendChild(modal.container);
    }

    function updatePlaybackSpeed(change, displayElement) {
        const media = findMediaElement();
        if (media) {
            let newRate = Math.max(0.25, Math.min(2.0, (media.playbackRate || 1.0) + change));
            media.playbackRate = newRate;
            displayElement.textContent = `${newRate.toFixed(2)}x`;
        }
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 16px 24px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            z-index: 10001;
            animation: slideIn 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(400px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    // --- Global Media Hotkeys ---
    function attachGlobalHotkeys() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (!e.ctrlKey) return;
            const media = findMediaElement();
            if (!media) return;

            let handled = false;
            switch (e.code) {
                case 'Space':
                    media.paused ? media.play() : media.pause();
                    handled = true;
                    break;
                case 'ArrowLeft':
                    media.currentTime = Math.max(0, media.currentTime - 5);
                    handled = true;
                    break;
                case 'ArrowRight':
                    media.currentTime += 5;
                    handled = true;
                    break;
            }
            if (handled) e.preventDefault();
        }, true);
    }

    // --- Auto-Save & Restore Functionality ---
    function getAutoSaveKey() {
        const url = window.location.href;
        const baseUrl = url.split('?')[0].split('#')[0];
        return `gtt-autosave-${baseUrl}`;
    }

    function startAutoSave(textarea) {
        if (autoSaveInterval) clearInterval(autoSaveInterval);
        autoSaveInterval = setInterval(() => {
            const content = textarea.value;
            if (content && content.length > 10 && content !== lastSavedContent) {
                const saveData = { content, timestamp: Date.now() };
                localStorage.setItem(getAutoSaveKey(), JSON.stringify(saveData));
                lastSavedContent = content;
                const statusEl = document.getElementById('gtt-autosave-status');
                if (statusEl) {
                    statusEl.textContent = `Draft saved at ${new Date().toLocaleTimeString()}`;
                    setTimeout(() => { if (statusEl) statusEl.textContent = ''; }, 3000);
                }
            }
        }, 15000);
    }

    function checkAndRestoreDraft(textarea) {
        const savedData = localStorage.getItem(getAutoSaveKey());
        if (savedData) {
            try {
                const { content, timestamp } = JSON.parse(savedData);
                const saveAge = (Date.now() - timestamp) / 1000 / 60;
                if (saveAge < 1440 && content && textarea.value.trim() !== content.trim()) {
                    if (confirm(`Unsaved draft found from ${Math.round(saveAge)} minutes ago. Would you like to restore it?`)) {
                        textarea.value = content;
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            } catch (e) { console.error("GTT V5: Error parsing saved draft.", e); }
        }
    }

    function clearDraft() {
        localStorage.removeItem(getAutoSaveKey());
        if (autoSaveInterval) clearInterval(autoSaveInterval);
        const statusEl = document.getElementById('gtt-autosave-status');
        if (statusEl) {
            statusEl.textContent = 'Lyrics saved! Draft cleared.';
            statusEl.style.color = '#ff9800';
        }
    }

})();
```
