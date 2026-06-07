const isProduction = process.env.NODE_ENV === "production";

export function getSessionSecret() {
  const secret = process.env.SESSION_SECRET?.trim();

  if (secret) {
    if (isProduction && secret.length < 32) {
      throw new Error("SESSION_SECRET must be at least 32 characters");
    }
    return secret;
  }

  if (isProduction) {
    throw new Error("SESSION_SECRET is required in production");
  }

  return "footlove-local-secret";
}

export function getAppUrl() {
  const configuredUrl = process.env.APP_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/$/, "");
  return "http://localhost:3000";
}
