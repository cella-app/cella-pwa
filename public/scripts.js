const msg = (t, ok = null) => {
  const el = document.getElementById("msg");
  el.textContent = t;
  el.className = "muted " + (ok === true ? "ok" : ok === false ? "err" : "");
};
async function call(path, method = "GET", body) {
  const secret = document.getElementById("secret").value.trim();
  if (!secret) {
    msg("Enter admin secret", false);
    throw new Error("no secret");
  }
  const init = {
    method,
    headers: { "X-Admin-Secret": secret, "Content-Type": "application/json" },
  };
  if (body) init.body = JSON.stringify(body);
  const r = await fetch(path, init);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error || r.statusText);
  return j;
}
document.getElementById("toggle").onclick = async () => {
  try {
    msg("Toggling…");
    const r = await call("/api/toggle", "POST");
    msg(`Done. errcode=${r.errcode ?? 0}`, (r.errcode ?? 0) === 0);
  } catch (e) {
    msg("Failed: " + e.message, false);
  }
};
document.getElementById("check").onclick = async () => {
  try {
    msg("Checking…");
    const r = await call("/api/state");
    const map = { 0: "Locked", 1: "Unlocked", 2: "Unknown" };
    msg(`State: ${map[r.state] ?? "Unknown"} (${r.state})`, true);
  } catch (e) {
    msg("Failed: " + e.message, false);
  }
};

// Event listener for the "Unlock/Lock" button
document.getElementById("unlockButton").addEventListener("click", function () {
  fetch("/api/toggle", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Secret": "cella-internal-2025", // Ensure x-admin-secret is sent for security
    },
    body: JSON.stringify({ lockId: 12345678 }), // Use the mock lockId for testing
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.mock) {
        alert("Mock toggle action: " + data.action);
      } else {
        alert("Real toggle action: " + data.action);
      }
    })
    .catch((error) => console.error("Error:", error));
});

// Event listener for "Check State" button
document
  .getElementById("checkStateButton")
  .addEventListener("click", function () {
    fetch("/api/state?lockId=12345678", {
      method: "GET",
      headers: {
        "X-Admin-Secret": "cella-internal-2025", // Ensure x-admin-secret is sent for security
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.mock) {
          alert(
            "Mock lock state: " + (data.state === 1 ? "Unlocked" : "Locked")
          );
        } else {
          alert(
            "Real lock state: " + (data.state === 1 ? "Unlocked" : "Locked")
          );
        }
      })
      .catch((error) => console.error("Error:", error));
  });
