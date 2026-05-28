document.addEventListener("DOMContentLoaded", () => {
  console.log("[popup] DOMContentLoaded");
  const statusElement = document.getElementById("trackingStatus");
  const toggleButton = document.getElementById("toggleTracking");
  const loginBtn = document.getElementById("loginBtn");

  if (!statusElement || !toggleButton || !loginBtn) {
    console.error("[popup] Missing required elements", {
      statusElement: !!statusElement,
      toggleButton: !!toggleButton,
      loginBtn: !!loginBtn
    });
    return;
  }

  // ─────────────────────────────────────────
  // CHECK TRACKING STATE
  // ─────────────────────────────────────────
  chrome.storage.local.get(["trackingEnabled"], (result) => {
    const enabled = result.trackingEnabled ?? true;
    console.log("[popup] Tracking enabled:", enabled);
    statusElement.textContent = enabled ? "ON" : "OFF";
  });

  // Wake the MV3 service worker and verify background logging.
  try {
    chrome.runtime.sendMessage({ type: "PING" }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("[popup] PING error:", chrome.runtime.lastError.message);
        return;
      }
      console.log("[popup] PING response:", response);
    });
  } catch (err) {
    console.warn("[popup] PING exception:", err);
  }

  // ─────────────────────────────────────────
  // TOGGLE TRACKING
  // ─────────────────────────────────────────
  toggleButton.addEventListener("click", () => {
    console.log("[popup] Toggle clicked");
    chrome.storage.local.get(["trackingEnabled"], (result) => {
      const enabled = result.trackingEnabled ?? true;

      chrome.storage.local.set({ trackingEnabled: !enabled }, () => {
        statusElement.textContent = !enabled ? "ON" : "OFF";
        console.log("[popup] Tracking set to:", !enabled);
      });
    });
  });

  // ─────────────────────────────────────────
  // LOGIN BUTTON
  // ─────────────────────────────────────────
  loginBtn.addEventListener("click", async () => {
    console.log("[popup] Login clicked");
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alert("Enter email and password");
      return;
    }

    await login(email, password);
  });
});

// ─────────────────────────────────────────
// LOGIN FUNCTION (Supabase REST)
// ─────────────────────────────────────────
async function login(email, password) {
  console.log("Attempting login...");

  try {
    const response = await fetch(
      "https://xkusogwnlysejolascju.supabase.co/auth/v1/token?grant_type=password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey":
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrdXNvZ3dubHlzZWpvbGFzY2p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMTA1MzYsImV4cCI6MjA4MTg4NjUzNn0.64BVoiR6pL0ryr--slSz25F2TmnjpKwQ2X4_D11t7Iw"
        },
        body: JSON.stringify({ email, password })
      }
    );

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : { raw: await response.text() };

    console.log("Login response:", data);

    if (response.ok && data.access_token) {
      chrome.storage.local.set(
        {
          supabaseToken: data.access_token
        },
        () => {
          console.log("Token stored successfully");
          alert("Login successful");
        }
      );
    } else {
      const message =
        data?.error_description ||
        data?.error ||
        data?.message ||
        (data?.raw ? String(data.raw) : "Login failed");
      console.error("Login error:", data);
      alert(`Login failed: ${message}`);
    }
  } catch (err) {
    const message = err?.message ? err.message : String(err);
    console.error("Login exception:", err);
    alert(`Login failed: ${message}`);
  }
}
