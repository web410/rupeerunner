/* =====================================================
   RupeeRunner Withdraw System - app.js
   FIXED Auth0 Redirect + Full Demo
   ===================================================== */

/* ===================== CONFIG ======================= */
const API = "https://script.google.com/macros/s/AKfycbzS_P2RmYzj2dVWyUDwWYQ5VG2nn7aDSv5UKPStH3KvkFBodDQzY8J8iRjMqG_y08Cd/exec";

const auth0Client = new auth0.Auth0Client({
  domain: "dev-nil04cagtdkw1jp1.us.auth0.com",
  clientId: "Vx7V7OBG7U5k6eHxGqFigS0Vpi0TGT0F",
  authorizationParams: {
    redirect_uri: "https://web410.github.io/rupeerunner/dashboard.html"
  }
});

const ADMIN_EMAILS = ["admin@gmail.com"]; // change to your admin email
/* ==================================================== */


/* ================= AUTH ============================= */
async function login() {
  await auth0Client.loginWithRedirect();
}

async function logout() {
  await auth0Client.logout({
    logoutParams: {
      returnTo: "https://web410.github.io/rupeerunner/index.html"
    }
  });
}
/* ==================================================== */


/* ================= INIT (FIXED) ===================== */
async function init() {
  /* 🔑 REQUIRED: Handle Auth0 redirect */
  if (location.search.includes("code=") && location.search.includes("state=")) {
    await auth0Client.handleRedirectCallback();
    window.history.replaceState({}, document.title, location.pathname);
  }

  const isAuth = await auth0Client.isAuthenticated();

  /* Not logged in → force login page */
  if (!isAuth && !location.pathname.includes("index.html")) {
    location.href = "index.html";
    return;
  }

  /* Logged in but still on login page → dashboard */
  if (isAuth && location.pathname.includes("index.html")) {
    location.href = "dashboard.html";
    return;
  }

  if (!isAuth) return;

  const user = await auth0Client.getUser();

  /* -------- ADMIN PAGE PROTECTION -------- */
  if (location.pathname.includes("admin.html")) {
    if (!ADMIN_EMAILS.includes(user.email)) {
      alert("Unauthorized access");
      await logout();
      return;
    }
  }
  /* -------------------------------------- */

  /* -------- SHOW USER INFO -------- */
  const userDiv = document.getElementById("user");
  if (userDiv) {
    userDiv.innerHTML = `
      <p><strong>Name:</strong> ${user.name}</p>
      <p><strong>Email:</strong> ${user.email}</p>
    `;
  }
  /* -------------------------------- */

  /* -------- ADD USER TO SHEET -------- */
  fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "addUser",
      auth0_id: user.sub,
      email: user.email,
      name: user.name
    })
  });
  /* ---------------------------------- */

  /* -------- SET ONLINE STATUS -------- */
  fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "setOnline",
      auth0_id: user.sub,
      online: true
    })
  });

  window.addEventListener("beforeunload", () => {
    navigator.sendBeacon(
      API,
      JSON.stringify({
        action: "setOnline",
        auth0_id: user.sub,
        online: false
      })
    );
  });
  /* ---------------------------------- */

  /* Load admin data if admin page */
  loadAdminData();
}
/* ==================================================== */


/* ================= WITHDRAW ========================= */
async function withdraw() {
  const amountInput = document.getElementById("amount");
  if (!amountInput) return;

  const amount = Number(amountInput.value);
  if (amount <= 0) {
    alert("Enter a valid amount");
    return;
  }

  const user = await auth0Client.getUser();

  fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "withdraw",
      auth0_id: user.sub,
      amount: amount
    })
  })
    .then(() => {
      alert("Withdraw request submitted");
      amountInput.value = "";
    })
    .catch(() => {
      alert("Withdraw failed");
    });
}
/* ==================================================== */


/* ================= ADMIN PANEL ====================== */
async function loadAdminData() {
  if (!location.pathname.includes("admin.html")) return;

  const res = await fetch(API, {
    method: "POST",
    body: JSON.stringify({ action: "getAdminData" })
  });

  const data = await res.json();
  const withdraws = data.withdraws || [];

  const table = document.getElementById("withdrawTable");
  if (!table) return;

  withdraws.slice(1).forEach(w => {
    if (w[3] !== "processing") return;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${w[0]}</td>
      <td>${w[1]}</td>
      <td>${w[3]}</td>
      <td>
        <button onclick="approveWithdraw('${w[0]}')">Approve</button>
        <button onclick="rejectWithdraw('${w[0]}')">Reject</button>
      </td>
    `;
    table.appendChild(row);
  });
}

async function approveWithdraw(auth0_id) {
  await fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "updateWithdrawStatus",
      auth0_id,
      status: "completed"
    })
  });
  alert("Withdraw approved");
  location.reload();
}

async function rejectWithdraw(auth0_id) {
  await fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "updateWithdrawStatus",
      auth0_id,
      status: "rejected"
    })
  });
  alert("Withdraw rejected");
  location.reload();
}
/* ==================================================== */


/* ================= START APP ======================== */
init();
/* ==================================================== */
