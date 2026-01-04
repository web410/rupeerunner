const auth0Client = new auth0.Auth0Client({
  domain: "https://web410.github.io/rupeerunner/",
  clientId: "Vx7V7OBG7U5k6eHxGqFigS0Vpi0TGT0F",
  authorizationParams: {
    redirect_uri: window.location.origin + "/dashboard.html"
  }
});

const API = "https://script.google.com/macros/s/AKfycbzS_P2RmYzj2dVWyUDwWYQ5VG2nn7aDSv5UKPStH3KvkFBodDQzY8J8iRjMqG_y08Cd/exec";

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

