import type { OAuthCredentials, TokenResponse } from "../types/index.ts";

const REDIRECT_PORT = 8742;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`;
const SCOPES = ["openid", "offline_access", "time_tracking", "time_tracking.write", "employee"];

interface OAuthConfig {
  companyDomain: string;
  clientId: string;
  clientSecret: string;
}

function buildAuthorizationUrl(config: OAuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: SCOPES.join(" "),
    state,
  });
  return `https://${config.companyDomain}.bamboohr.com/authorize.php?${params}`;
}

async function exchangeCodeForTokens(
  config: OAuthConfig,
  code: string
): Promise<TokenResponse> {
  const response = await fetch(
    `https://${config.companyDomain}.bamboohr.com/token.php`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: REDIRECT_URI,
        code,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json() as Promise<TokenResponse>;
}

export async function refreshAccessToken(credentials: OAuthCredentials): Promise<OAuthCredentials> {
  const response = await fetch(
    `https://${credentials.companyDomain}.bamboohr.com/token.php`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        refresh_token: credentials.refreshToken,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const tokens = await response.json() as TokenResponse;
  return {
    ...credentials,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAtMs: Date.now() + tokens.expires_in * 1000,
  };
}

async function waitForAuthorizationCode(expectedState: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = Bun.serve({
      port: REDIRECT_PORT,
      fetch(req) {
        const url = new URL(req.url);
        if (url.pathname !== "/callback") {
          return new Response("Not found", { status: 404 });
        }

        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error) {
          const description = url.searchParams.get("error_description") ?? error;
          reject(new Error(`Authorization failed: ${description}`));
          server.stop();
          return new Response(
            "<html><body><h1>Authorization Failed</h1><p>You can close this window.</p></body></html>",
            { headers: { "Content-Type": "text/html" } }
          );
        }

        if (state !== expectedState) {
          reject(new Error("State mismatch - possible CSRF attack"));
          server.stop();
          return new Response("Invalid state", { status: 400 });
        }

        if (!code) {
          reject(new Error("No authorization code received"));
          server.stop();
          return new Response("No code", { status: 400 });
        }

        resolve(code);
        setTimeout(() => server.stop(), 100);
        return new Response(
          "<html><body><h1>Success!</h1><p>You can close this window and return to the terminal.</p></body></html>",
          { headers: { "Content-Type": "text/html" } }
        );
      },
    });
  });
}

function openBrowser(url: string): void {
  const platform = process.platform;
  const cmd = platform === "darwin" ? "open" : platform === "win32" ? "start" : "xdg-open";
  Bun.spawn([cmd, url]);
}

export async function startOAuthFlow(config: OAuthConfig): Promise<OAuthCredentials> {
  const state = crypto.randomUUID();
  const authUrl = buildAuthorizationUrl(config, state);

  console.log("\nOpening browser for BambooHR authorization...");
  console.log(`If the browser doesn't open, visit: ${authUrl}\n`);

  openBrowser(authUrl);

  const code = await waitForAuthorizationCode(state);
  const tokens = await exchangeCodeForTokens(config, code);

  return {
    type: "oauth",
    companyDomain: config.companyDomain,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAtMs: Date.now() + tokens.expires_in * 1000,
  };
}

export { REDIRECT_URI, SCOPES };
