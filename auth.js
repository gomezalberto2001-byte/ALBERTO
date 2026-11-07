// Inicio de sesión con GitHub para el panel /admin (Decap CMS).
// Variables de entorno en Vercel: GITHUB_CLIENT_ID y GITHUB_CLIENT_SECRET
const crypto = require("crypto");

module.exports = (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    res.status(500).send("Falta la variable GITHUB_CLIENT_ID en Vercel.");
    return;
  }
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const redirectUri = `${proto}://${host}/api/callback`;
  const state = crypto.randomBytes(16).toString("hex");

  res.setHeader(
    "Set-Cookie",
    `decap_oauth_state=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  );
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "repo,user");
  url.searchParams.set("state", state);
  res.writeHead(302, { Location: url.toString() });
  res.end();
};
