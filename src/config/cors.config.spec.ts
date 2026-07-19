import {
  createCorsOptions,
  getAllowedCorsOrigins,
  parseAllowedCorsOrigins,
} from './cors.config';

describe('cors config', () => {
  function checkOrigin(origin: string | undefined, allowedOrigins: string) {
    const options = createCorsOptions({
      CORS_ALLOWED_ORIGINS: allowedOrigins,
    });
    const originHandler = options.origin as (
      requestOrigin: string | undefined,
      callback: (error: Error | null, allowed?: boolean) => void,
    ) => void;

    let result: { error: Error | null; allowed?: boolean } | undefined;
    originHandler(origin, (error, allowed) => {
      result = { error, allowed };
    });

    return result;
  }

  it('parses comma-separated allowed origins', () => {
    expect(
      parseAllowedCorsOrigins(
        'https://app.swiftex.com, https://admin.swiftex.com,',
      ),
    ).toEqual(['https://app.swiftex.com', 'https://admin.swiftex.com']);
  });

  it('allows a configured origin', () => {
    expect(
      checkOrigin(
        'https://app.swiftex.com',
        'https://app.swiftex.com,https://admin.swiftex.com',
      ),
    ).toEqual({ error: null, allowed: true });
  });

  it('rejects an unconfigured origin', () => {
    const result = checkOrigin(
      'https://evil.example',
      'https://app.swiftex.com',
    );

    expect(result?.error?.message).toBe('Origin not allowed by CORS');
    expect(result?.allowed).toBe(false);
  });

  it('allows requests without an origin header', () => {
    expect(checkOrigin(undefined, 'https://app.swiftex.com')).toEqual({
      error: null,
      allowed: true,
    });
  });

  it('fails closed in production when no origins are configured', () => {
    expect(() =>
      getAllowedCorsOrigins({
        ENVIRONMENT: 'prod',
        CORS_ALLOWED_ORIGINS: '',
      }),
    ).toThrow('CORS_ALLOWED_ORIGINS must be set in production');
  });
});
