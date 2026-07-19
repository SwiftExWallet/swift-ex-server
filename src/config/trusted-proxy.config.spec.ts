import {
  configureTrustedProxy,
  parseTrustedProxies,
} from './trusted-proxy.config';

describe('trusted proxy config', () => {
  it('parses comma-separated trusted proxies', () => {
    expect(parseTrustedProxies('loopback, 10.0.0.0/8, 172.16.0.0/12')).toEqual([
      'loopback',
      '10.0.0.0/8',
      '172.16.0.0/12',
    ]);
  });

  it('disables trust proxy when no proxies are configured', () => {
    const app = { set: jest.fn() };

    configureTrustedProxy(app, '');

    expect(app.set).toHaveBeenCalledWith('trust proxy', false);
  });

  it('trusts only configured proxy addresses', () => {
    const app = { set: jest.fn() };

    configureTrustedProxy(app, 'loopback,10.0.0.0/8');

    expect(app.set).toHaveBeenCalledWith('trust proxy', [
      'loopback',
      '10.0.0.0/8',
    ]);
  });
});
