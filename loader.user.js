// ==UserScript==
// @name         Genius Rich Lyric Editor (Auto-Updating Loader)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Dynamically loads the advanced Genius editor from GitHub with a 1-hour cache.
// @author       You
// @match        *://genius.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      raw.githubusercontent.com
// ==/UserScript==

(function() {
    'use strict';

    // ⚠️ REPLACE WITH YOUR ACTUAL GITHUB RAW URL
    const PAYLOAD_URL = 'https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/dist/bundle.js';

    const CACHE_KEY = 'GeniusEditor_Payload';
    const CACHE_TIME_KEY = 'GeniusEditor_LastFetch';
    const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 Hour

    function executeScript(code) {
        try {
            // Evaluates the fetched string in the global scope securely
            const scriptFn = new Function(code);
            scriptFn();
            console.log('✅ Genius Editor Payload executed successfully.');
        } catch (e) {
            console.error('❌ Error executing Genius Editor Payload:', e);
        }
    }

    function fetchAndCache() {
        console.log('🌐 Fetching latest Genius Editor script from GitHub...');
        GM_xmlhttpRequest({
            method: 'GET',
            url: PAYLOAD_URL,
            onload: function(response) {
                if (response.status === 200) {
                    GM_setValue(CACHE_KEY, response.responseText);
                    GM_setValue(CACHE_TIME_KEY, Date.now());
                    executeScript(response.responseText);
                } else {
                    console.error('❌ Failed to fetch payload. Status:', response.status);
                    loadFromCache(); // Fallback
                }
            },
            onerror: function(err) {
                console.error('❌ Network error fetching payload:', err);
                loadFromCache(); // Fallback
            }
        });
    }

    function loadFromCache() {
        const cachedCode = GM_getValue(CACHE_KEY, null);
        if (cachedCode) {
            console.log('♻️ Loading Genius Editor from cache (Fallback/Valid).');
            executeScript(cachedCode);
        } else {
            console.error('❌ No cached version available.');
        }
    }

    // --- Init ---
    const lastFetch = GM_getValue(CACHE_TIME_KEY, 0);
    const now = Date.now();

    if (now - lastFetch > CACHE_DURATION_MS || !GM_getValue(CACHE_KEY)) {
        fetchAndCache();
    } else {
        const minutesLeft = Math.round((CACHE_DURATION_MS - (now - lastFetch)) / 60000);
        console.log(`⏱️ Genius Editor cache valid for ${minutesLeft} more minutes.`);
        loadFromCache();
    }
})();
