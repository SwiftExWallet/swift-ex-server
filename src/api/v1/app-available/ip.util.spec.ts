import { getClientIpFromRequest } from './ip.util';

describe('getClientIpFromRequest', () => {
  it('uses the Express-resolved IP', () => {
    expect(getClientIpFromRequest({ ip: '203.0.113.10' })).toBe('203.0.113.10');
  });

  it('does not trust x-forwarded-for directly', () => {
    expect(
      getClientIpFromRequest({
        headers: { 'x-forwarded-for': '198.51.100.99' },
        socket: { remoteAddress: '10.0.0.5' },
      }),
    ).toBe('10.0.0.5');
  });

  it('falls back to Unknown when no socket IP is available', () => {
    expect(getClientIpFromRequest({ headers: {} })).toBe('Unknown');
  });
});
