// Vuelta del login de GitHub: entrega el token a la ventana del panel /admin.
function reply(res, status, content) {
  const message = `authorization:github:${status}:${JSON.stringify(content)}`;
  const safe = JSON.stringify(message).replace(/</g, "\\u003c");
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Set-Cookie", "decap_oauth_state=; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
  res.status(200).send(`<!doctype html><html><body><script>
(function () {
  var msg = ${safe};
  function receive(e) {
    if (e.origin !== window.location.origin) return;
    window.opener.postMessage(msg, e.origin);
    window.removeEventListener("message", receive, false);
  }
  window.addEventListener("message", receive, false);
  window.opener.postMessage("authorizing:github", window.location.origin);
})();
</script><p>Conectando…</p></body></html>`);
}

module.exports = async (req, res) => {
  const { code, state } = req.query || {};
  const cookies = Object.fromEntries(
    (req.headers.cookie || "")
      .split(";")
      .map((c) => c.trim().split("="))
      .filter((p) => p[0])
  );

  if (!code || !state || cookies.decap_oauth_state !== state) {
    reply(res, "error", { message: "Sesión caducada o no válida. Vuelve a intentarlo." });
    return;
  }

  try {
    const r = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const data = await r.json();
    if (!data.access_token) {
      reply(res, "error", { message: data.error_description || "GitHub no devolvió acceso." });
      return;
    }
    reply(res, "success", { token: data.access_token, provider: "github" });
  } catch (err) {
    reply(res, "error", { message: "Error conectando con GitHub." });
  }
};
