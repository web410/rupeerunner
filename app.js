const auth0Client = new auth0.Auth0Client({
  domain: "YOUR_DOMAIN",
  clientId: "YOUR_CLIENT_ID",
  authorizationParams: {
    redirect_uri: window.location.origin + "/dashboard.html"
  }
});

const API = "YOUR_APPS_SCRIPT_URL";

async function login() {
  await auth0Client.loginWithRedirect();
}

async function logout() {
  await auth0Client.logout({
    logoutParams: { returnTo: window.location.origin }
  });
}

async function init() {
  const isAuth = await auth0Client.isAuthenticated();
  if (!isAuth && !location.pathname.includes("index")) {
    location.href = "index.html";
    return;
  }

  if (isAuth) {
    const user = await auth0Client.getUser();
    document.getElementById("user")?.innerHTML = `
      <p>${user.name}</p>
      <p>${user.email}</p>
    `;

    fetch(API, {
      method: "POST",
      body: JSON.stringify({
        action: "addUser",
        auth0_id: user.sub,
        email: user.email,
        name: user.name
      })
    });
  }
}

async function withdraw() {
  const amt = document.getElementById("amount").value;
  const user = await auth0Client.getUser();

  fetch(API, {
    method: "POST",
    body: JSON.stringify({
      action: "withdraw",
      auth0_id: user.sub,
      amount: Number(amt)
    })
  });
}

init();
