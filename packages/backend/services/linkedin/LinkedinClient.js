const AUTORIZACION_URL = "https://www.linkedin.com/oauth/v2/authorization";
const TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const USERINFO_URL = "https://api.linkedin.com/v2/userinfo";
const POSTS_URL = "https://api.linkedin.com/rest/posts";
const SCOPES = "openid profile w_member_social";
const TIMEOUT_MS = 8000;

export class LinkedinError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export class LinkedinClient {
  constructor(config = process.env, fetchFn = (...args) => fetch(...args)) {
    this.config = config;
    this.fetch = fetchFn;
  }

  estaConfigurado() {
    const {
      LINKEDIN_CLIENT_ID,
      LINKEDIN_CLIENT_SECRET,
      LINKEDIN_REDIRECT_URI,
    } = this.config;
    return Boolean(
      LINKEDIN_CLIENT_ID && LINKEDIN_CLIENT_SECRET && LINKEDIN_REDIRECT_URI,
    );
  }

  urlAutorizacion(state) {
    const parametros = new URLSearchParams({
      response_type: "code",
      client_id: this.config.LINKEDIN_CLIENT_ID,
      redirect_uri: this.config.LINKEDIN_REDIRECT_URI,
      scope: SCOPES,
      state,
    });
    return `${AUTORIZACION_URL}?${parametros}`;
  }

  async intercambiarCodigo(code) {
    const respuesta = await this.fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: this.config.LINKEDIN_REDIRECT_URI,
        client_id: this.config.LINKEDIN_CLIENT_ID,
        client_secret: this.config.LINKEDIN_CLIENT_SECRET,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!respuesta.ok) {
      throw new LinkedinError("no se pudo canjear el código", respuesta.status);
    }
    const { access_token, expires_in } = await respuesta.json();
    return {
      accessToken: access_token,
      expiraEn: new Date(Date.now() + expires_in * 1000),
    };
  }

  // sub = id del miembro; es lo que arma el urn del autor del post
  async obtenerPerfil(accessToken) {
    const respuesta = await this.fetch(USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!respuesta.ok) {
      throw new LinkedinError("no se pudo leer el perfil", respuesta.status);
    }
    const { sub, name } = await respuesta.json();
    return { personUrn: `urn:li:person:${sub}`, nombre: name };
  }

  // devuelve el urn del post creado
  async publicar(accessToken, personUrn, texto) {
    const respuesta = await this.fetch(POSTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        "Linkedin-Version": this.config.LINKEDIN_API_VERSION ?? "202608",
      },
      body: JSON.stringify({
        author: personUrn,
        commentary: texto,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!respuesta.ok) {
      throw new LinkedinError(
        "Linkedin rechazó la publicación",
        respuesta.status,
      );
    }
    return respuesta.headers.get("x-restli-id");
  }
}
