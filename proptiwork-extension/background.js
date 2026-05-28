let currentDomain = null;
let startTime = null;
let cachedSession = { userId: null, active: false, checkedAt: 0 };
const SESSION_CACHE_MS = 30000;
const HEARTBEAT_MS = 60000;
const HEARTBEAT_ALARM = "heartbeat";
const FETCH_TIMEOUT_MS = 15000;
const SUPABASE_URL = "https://xkusogwnlysejolascju.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrdXNvZ3dubHlzZWpvbGFzY2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMTA1MzYsImV4cCI6MjA4MTg4NjUzNn0.64BVoiR6pL0ryr--slSz25F2TmnjpKwQ2X4_D11t7Iw";

console.log("[background] Service worker loaded");

function scheduleHeartbeat() {
  if (!chrome.alarms) {
    console.warn("[background] chrome.alarms unavailable. Check permissions.");
    return;
  }
  const minutes = Math.max(1, Math.ceil(HEARTBEAT_MS / 60000));
  chrome.alarms.create(HEARTBEAT_ALARM, { periodInMinutes: minutes });
  console.log("[background] Heartbeat alarm scheduled:", minutes, "min");
}

chrome.runtime.onInstalled.addListener(() => {
  console.log("[background] onInstalled");
  scheduleHeartbeat();
});

chrome.runtime.onStartup.addListener(() => {
  console.log("[background] onStartup");
  scheduleHeartbeat();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "PING") {
    console.log("[background] PING from", sender?.id || "unknown");
    sendResponse({ ok: true, time: Date.now() });
    return;
  }
});

if (chrome.alarms) {
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === HEARTBEAT_ALARM) {
      console.log("[background] Heartbeat alarm fired");
      try {
        await heartbeat();
      } catch (err) {
        console.warn("[background] Heartbeat failed:", getErrorMessage(err));
      }
    }
  });
}

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    console.log("[background] onActivated", tab?.url);
    await handleTabChange(tab?.url);
  } catch (err) {
    console.warn(
      "[background] Failed to process activated tab:",
      getErrorMessage(err)
    );
  }
});
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active) {
    try {
      console.log("[background] onUpdated", tab?.url);
      await handleTabChange(tab?.url);
    } catch (err) {
      console.warn(
        "[background] Failed to process updated tab:",
        getErrorMessage(err)
      );
    }
  }
});
async function handleTabChange(url) {
  if (!url) return;

  // Ignore chrome://, about:, extension pages
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return;
  }

  const trackingEnabled = await isTrackingEnabled();
  if (!trackingEnabled) {
    console.log("[background] Tracking disabled");
    currentDomain = null;
    startTime = null;
    return;
  }

  const auth = await getAuthContext();
  if (!auth) {
    console.log("[background] No auth context");
    currentDomain = null;
    startTime = null;
    return;
  }

  const hasSession = await hasActiveSession(auth.userId, auth.token);
  if (!hasSession) {
    console.log("[background] No active session");
    currentDomain = null;
    startTime = null;
    return;
  }

  let domain;

  try {
    domain = new URL(url).hostname;
  } catch (err) {
    console.log("Invalid URL skipped:", url);
    return;
  }

  const now = Date.now();

  console.log("[background] Switching domain ->", domain);
  await flushCurrentDomain(auth, now);

  currentDomain = domain;
  startTime = now;
}

async function isTrackingEnabled() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["trackingEnabled"], (result) => {
      resolve(result.trackingEnabled ?? true);
    });
  });
}
async function getStoredToken() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["supabaseToken"], (result) => {
      resolve(result.supabaseToken || null);
    });
  });
}

async function clearStoredToken() {
  return new Promise((resolve) => {
    chrome.storage.local.remove(["supabaseToken"], () => resolve());
  });
}

function decodeUserId(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));
    return payload.sub || null;
  } catch (err) {
    console.error("Failed to decode token:", err);
    return null;
  }
}

async function getAuthContext() {
  const token = await getStoredToken();

  if (!token) {
    console.log("No token found. Skipping send.");
    return null;
  }

  const userId = decodeUserId(token);
  if (!userId) return null;

  return { token, userId };
}

function getSupabaseHeaders(token, { hasBody = false, prefer } = {}) {
  const headers = {
    apikey: SUPABASE_ANON_KEY,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (hasBody) {
    headers["Content-Type"] = "application/json";
  }

  if (prefer) {
    headers.Prefer = prefer;
  }

  return headers;
}

async function readResponseBody(response) {
  const contentType = response.headers.get("content-type") || "";
  return contentType.includes("application/json")
    ? await response.json()
    : await response.text();
}

function getErrorMessage(err) {
  if (err?.name === "AbortError") {
    return `Request timed out after ${FETCH_TIMEOUT_MS}ms`;
  }

  if (err?.status) {
    const details =
      typeof err.details === "string"
        ? err.details
        : JSON.stringify(err.details || {});
    return `${err.status} ${err.message}${details ? ` - ${details}` : ""}`;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return String(err);
}

async function fetchFromSupabase(path, { method = "GET", token, body, prefer } = {}) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new Error("Browser is offline");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(`${SUPABASE_URL}${path}`, {
      method,
      headers: getSupabaseHeaders(token, {
        hasBody: body != null,
        prefer,
      }),
      body: body != null ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = new Error(response.statusText || "Supabase request failed");
      error.status = response.status;
      error.details = await readResponseBody(response);
      throw error;
    }

    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return await response.text();
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function hasActiveSession(userId, token) {
  const now = Date.now();
  if (
    cachedSession.userId === userId &&
    now - cachedSession.checkedAt < SESSION_CACHE_MS
  ) {
    return cachedSession.active;
  }

  try {
    const rows = await fetchFromSupabase(
      `/rest/v1/work_sessions?user_id=eq.${encodeURIComponent(
        userId
      )}&logout_time=is.null&select=id&limit=1`,
      { token }
    );
    const active = Array.isArray(rows) && rows.length > 0;
    console.log("[background] Active session:", active);
    cachedSession = { userId, active, checkedAt: now };
    return active;
  } catch (err) {
    if (err?.status === 401) {
      await clearStoredToken();
      console.warn("[background] Supabase token expired. Cleared stored token.");
    }
    console.warn("[background] Active session check failed:", getErrorMessage(err));
    cachedSession = { userId, active: false, checkedAt: now };
    return false;
  }
}

async function sendActivity({ domain, duration, startMs, endMs, token, userId }) {
  const startTimeIso = new Date(startMs).toISOString();
  const endTimeIso = new Date(endMs).toISOString();

  try {
    await fetchFromSupabase("/rest/v1/activity_logs", {
      method: "POST",
      token,
      prefer: "return=minimal",
      body: {
        user_id: userId,
        domain,
        start_time: startTimeIso,
        end_time: endTimeIso,
        duration_seconds: duration,
      },
    });

    console.log("Activity sent:", domain, duration);
  } catch (err) {
    console.warn("[background] Failed to send activity:", getErrorMessage(err));
  }
}

async function flushCurrentDomain(auth, now) {
  if (!currentDomain || !startTime) return;

  const duration = Math.floor((now - startTime) / 1000);
  if (duration <= 0) return;

  await sendActivity({
    domain: currentDomain,
    duration,
    startMs: startTime,
    endMs: now,
    token: auth.token,
    userId: auth.userId,
  });
}

async function heartbeat() {
  if (!currentDomain || !startTime) return;

  const trackingEnabled = await isTrackingEnabled();
  if (!trackingEnabled) {
    currentDomain = null;
    startTime = null;
    return;
  }

  const auth = await getAuthContext();
  if (!auth) {
    currentDomain = null;
    startTime = null;
    return;
  }

  const hasSession = await hasActiveSession(auth.userId, auth.token);
  if (!hasSession) {
    currentDomain = null;
    startTime = null;
    return;
  }

  const now = Date.now();
  await flushCurrentDomain(auth, now);
  startTime = now;
}

scheduleHeartbeat();

/*async function sendActivity(domain, duration) {
  console.log("Tracked:", domain, duration, "seconds");
}*/
