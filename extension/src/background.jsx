/**
 * =====================================================
 * PRODUCTIVITY PLATFORM - BACKGROUND SERVICE WORKER (V3)
 * =====================================================
 * Handles tracking, focus mode blocking, and dashboard syncing.
 * =====================================================
 */

const API_URL = "http://localhost:3000/api";
let activeTab = null;
let activeTitle = "";
let startTime = null;
let lastSaveTime = null;

// Engagement Buffers (Accumulated between saves)
let scrollCount = 0;
let clickCount = 0;
let pageContent = ""; // Stores snippet for AI classification


// Focus Mode State
let blocklist = [];
let preferences = {
    strictMode: true,
    smartBlock: true,
    breakReminders: false
};

// Initialization
const initPromise = init();

// ==================== HEARTBEAT ====================

async function heartbeat() {
    if (activeTab && startTime) {
        const now = Date.now();
        const start = lastSaveTime || startTime;
        const elapsed = (now - start) / 1000;

        if (elapsed >= 5) { // Save every 5 seconds
            await saveSession(activeTab, Math.floor(elapsed), activeTitle, scrollCount, clickCount, pageContent);
            lastSaveTime = now;

            // Reset engagement buffers after sync
            scrollCount = 0;
            clickCount = 0;
            pageContent = ""; // Clear content after sending

            chrome.storage.local.set({ lastSaveTime });
        }
    }
}


// ==================== CORE TRACKING ====================

function isTrackable(url) {
    if (!url) return false;
    try {
        const u = new URL(url);
        return u.protocol === "http:" || u.protocol === "https:";
    } catch {
        return false;
    }
}

async function saveSession(website, timeSeconds, pageTitle = "", scrolls = 0, clicks = 0, content = "") {
    if (!website || timeSeconds <= 0) return;

    try {
        const data = await chrome.storage.local.get(["siteTimes"]);
        const siteTimes = data.siteTimes || {};
        siteTimes[website] = (siteTimes[website] || 0) + timeSeconds;
        await chrome.storage.local.set({ siteTimes });
    } catch (err) {
        console.error("❌ Local Tracking error:", err);
    }

    try {
        await fetch(`${API_URL}/tracking`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                website,
                time: timeSeconds,
                pageTitle,
                scrolls,
                clicks,
                content
            })
        });
    } catch (err) {
        // Silent fail on backend sync
    }
}


async function handleTabSwitch(url, title = "") {
    await initPromise;

    if (activeTab && url.includes(activeTab) && title === activeTitle) {
        return;
    }

    if (activeTab && startTime) {
        const start = lastSaveTime || startTime;
        const elapsed = (Date.now() - start) / 1000;
        await saveSession(activeTab, Math.floor(elapsed), activeTitle, scrollCount, clickCount, pageContent);
    }

    lastSaveTime = null;
    scrollCount = 0;
    clickCount = 0;
    pageContent = "";
    chrome.storage.local.remove("lastSaveTime");

    if (!isTrackable(url)) {
        activeTab = null;
        activeTitle = "";
        startTime = null;
        chrome.storage.local.remove(["activeTab", "activeTitle", "startTime"]);
        return;
    }

    try {
        activeTab = new URL(url).hostname;
    } catch (err) {
        console.error("❌ Invalid URL for tracking:", url);
        activeTab = null;
    }
    activeTitle = title || "";
    startTime = Date.now();

    chrome.storage.local.set({ activeTab, activeTitle, startTime });
}


// ==================== FOCUS MODE ENGINE ====================

async function updateSyncData() {
    console.log("🔄 Fetching latest focus data from API...");
    try {
        // 1. Fetch Blocklist
        const blockRes = await fetch(`${API_URL}/focus/`);
        if (blockRes.ok) {
            const data = await blockRes.json();
            blocklist = data.map(site => site.website.toLowerCase().replace('www.', ''));
            await chrome.storage.local.set({ blocklist });
            console.log("✅ Blocklist updated:", blocklist);
        }

        // 2. Fetch Preferences
        const prefRes = await fetch(`${API_URL}/auth/preferences`);
        if (prefRes.ok) {
            preferences = await prefRes.json();
            await chrome.storage.local.set({ preferences });
            console.log("✅ Preferences updated:", preferences);
        }
    } catch (err) {
        console.warn("⚠️ Sync failed, using cached data:", err.message);
        const cache = await chrome.storage.local.get(["blocklist", "preferences"]);
        if (cache.blocklist) blocklist = cache.blocklist;
        if (cache.preferences) preferences = cache.preferences;
    }
}

// Blocking Logic
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    if (details.frameId !== 0) return; // Only block main frame

    await initPromise;

    if (!preferences.strictMode) return;

    try {
        const url = new URL(details.url);
        const host = url.hostname.toLowerCase().replace('www.', '');

        const isBlocked = blocklist.some(blockedHost =>
            host === blockedHost || host.endsWith('.' + blockedHost)
        );

        if (isBlocked) {
            console.log(`🛡️ Blocking access to: ${host}`);
            chrome.tabs.update(details.tabId, { url: chrome.runtime.getURL("blocked.html") });
        }
    } catch (err) {
        console.error("Blocking error:", err);
    }
});

// ==================== EVENTS ====================

chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === "heartbeat") heartbeat();
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    try {
        const tab = await chrome.tabs.get(activeInfo.tabId);
        if (tab && tab.url) handleTabSwitch(tab.url, tab.title);
    } catch (err) { }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.active && tab.url) {
        handleTabSwitch(tab.url, tab.title);
    }
});

chrome.runtime.onMessageExternal.addListener(async (request, sender, sendResponse) => {
    console.log("📩 Received external message:", request.action);
    if (request.action === "syncAll") {
        await updateSyncData();
        sendResponse({ success: true, message: "Sync complete" });
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "resetTracking") {
        startTime = Date.now();
        lastSaveTime = null;
        chrome.storage.local.set({ startTime, lastSaveTime: null });
        sendResponse({ success: true });
    } else if (request.action === "pageLoaded") {
        console.log("📄 Page Loaded:", request.url);
        handleTabSwitch(request.url, request.title);
        pageContent = request.content || "";
    } else if (request.action === "titleChanged") {
        console.log("✏️ Title Changed:", request.title);
        activeTitle = request.title;
    } else if (request.action === "engagementActivity") {
        // Only track engagement for the active tab to avoid crosstalk
        if (activeTab && request.url.includes(activeTab)) {
            scrollCount += request.scrolls || 0;
            clickCount += request.clicks || 0;
            console.log(`🖱️ Activity synced: ${scrollCount}s, ${clickCount}c`);
        }
    }
});


// ==================== INIT ====================

async function init() {
    const storage = await chrome.storage.local.get(["activeTab", "activeTitle", "startTime", "lastSaveTime", "blocklist", "preferences"]);

    if (storage.activeTab && storage.startTime) {
        activeTab = storage.activeTab;
        activeTitle = storage.activeTitle || "";
        startTime = storage.startTime;
        lastSaveTime = storage.lastSaveTime || null;
    }

    if (storage.blocklist) blocklist = storage.blocklist;
    if (storage.preferences) preferences = storage.preferences;

    chrome.alarms.create("heartbeat", { periodInMinutes: 0.1 });

    // Initial sync
    updateSyncData();
}
