type ProxyAwareApp = {
  set: (setting: string, value: string[] | false) => void;
};

export function parseTrustedProxies(
  proxies = process.env.TRUSTED_PROXIES,
): string[] {
  return (proxies ?? '')
    .split(',')
    .map((proxy) => proxy.trim())
    .filter(Boolean);
}

export function configureTrustedProxy(
  app: ProxyAwareApp,
  proxies = process.env.TRUSTED_PROXIES,
): void {
  const trustedProxies = parseTrustedProxies(proxies);

  app.set('trust proxy', trustedProxies.length > 0 ? trustedProxies : false);
}
