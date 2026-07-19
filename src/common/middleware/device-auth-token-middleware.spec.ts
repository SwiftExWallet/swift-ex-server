import { JwtService } from '@nestjs/jwt';
import { Keypair } from '@stellar/stellar-sdk';
import { SupportedWalletChain } from '../enum/chain';
import { DeviceAuthTokenMiddleware } from './device-auth-token-middleware';

describe('DeviceAuthTokenMiddleware', () => {
  const secret = 'test-device-jwt-secret';
  let jwtService: JwtService;
  let deviceService: { findOne: jest.Mock };
  let walletRepository: { findOne: jest.Mock };
  let middleware: DeviceAuthTokenMiddleware;

  beforeEach(() => {
    jwtService = new JwtService({ secret });
    deviceService = {
      findOne: jest.fn(),
    };
    walletRepository = {
      findOne: jest.fn(),
    };
    middleware = new DeviceAuthTokenMiddleware(
      jwtService,
      deviceService as any,
      walletRepository as any,
    );
  });

  it('hydrates the current device when the token is valid', async () => {
    const device = {
      _id: 'device-1',
      fcmToken: 'fcm-token',
    };
    deviceService.findOne.mockResolvedValue(device);
    const token = jwtService.sign({ _id: device._id }, { expiresIn: '1h' });
    const req: any = {
      headers: {
        'x-auth-device-token': token,
      },
    };
    const next = jest.fn();

    await middleware.use(req, {} as any, next);

    expect(deviceService.findOne).toHaveBeenCalledWith(device._id);
    expect(walletRepository.findOne).not.toHaveBeenCalled();
    expect(req.device).toBe(device);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects a token signed with the wrong secret before device lookup', async () => {
    const forgedToken = new JwtService({ secret: 'wrong-secret' }).sign({
      _id: 'device-1',
    });
    const req: any = {
      headers: {
        'x-auth-device-token': forgedToken,
      },
    };

    await expect(middleware.use(req, {} as any, jest.fn())).rejects.toThrow(
      'Invalid Device',
    );
    expect(deviceService.findOne).not.toHaveBeenCalled();
  });

  it('rejects an expired token before device lookup', async () => {
    const expiredToken = jwtService.sign({
      _id: 'device-1',
      exp: Math.floor(Date.now() / 1000) - 60,
    });
    const req: any = {
      headers: {
        'x-auth-device-token': expiredToken,
      },
    };

    await expect(middleware.use(req, {} as any, jest.fn())).rejects.toThrow(
      'Invalid Device',
    );
    expect(deviceService.findOne).not.toHaveBeenCalled();
  });

  it('requires a wallet address header for protected wallet/order routes', async () => {
    const device = {
      _id: 'device-1',
    };
    deviceService.findOne.mockResolvedValue(device);
    const token = jwtService.sign({ _id: device._id }, { expiresIn: '1h' });
    const req: any = {
      method: 'POST',
      path: '/api/v1/banxa/create-buy-order',
      headers: {
        'x-auth-device-token': token,
      },
    };

    await expect(middleware.use(req, {} as any, jest.fn())).rejects.toThrow(
      'x-wallet-address header is required',
    );
    expect(walletRepository.findOne).not.toHaveBeenCalled();
  });

  it('hydrates the xlm wallet when the header is a Stellar address owned by the device', async () => {
    const device = {
      _id: 'device-1',
    };
    const stellarAddress = Keypair.random().publicKey();
    const wallet = {
      _id: 'wallet-1',
      deviceId: device._id,
    };
    deviceService.findOne.mockResolvedValue(device);
    walletRepository.findOne.mockResolvedValue(wallet);
    const token = jwtService.sign({ _id: device._id }, { expiresIn: '1h' });
    const req: any = {
      method: 'POST',
      path: '/api/v1/banxa/create-buy-order',
      headers: {
        'x-auth-device-token': token,
        'x-wallet-address': stellarAddress,
      },
      body: {
        walletAddress: stellarAddress,
      },
    };
    const next = jest.fn();

    await middleware.use(req, {} as any, next);

    expect(walletRepository.findOne).toHaveBeenCalledWith({
      deviceId: device._id,
      [`addresses.${SupportedWalletChain.xlm}`]: stellarAddress,
    });
    expect(req.device).toBe(device);
    expect(req.wallet).toBe(wallet);
    expect(req.walletAddress).toBe(stellarAddress);
    expect(req.walletChain).toBe(SupportedWalletChain.xlm);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('hydrates the multi wallet when the header is not a Stellar address', async () => {
    const device = {
      _id: 'device-1',
    };
    const evmAddress = '0x1111111111111111111111111111111111111111';
    const wallet = {
      _id: 'wallet-1',
      deviceId: device._id,
    };
    deviceService.findOne.mockResolvedValue(device);
    walletRepository.findOne.mockResolvedValue(wallet);
    const token = jwtService.sign({ _id: device._id }, { expiresIn: '1h' });
    const req: any = {
      method: 'POST',
      path: '/api/v1/alchemy/create-buy-order',
      headers: {
        'x-auth-device-token': token,
        'x-wallet-address': evmAddress,
      },
      body: {
        address: evmAddress.toUpperCase(),
      },
    };
    const next = jest.fn();

    await middleware.use(req, {} as any, next);

    const query = walletRepository.findOne.mock.calls[0][0];
    expect(query.deviceId).toBe(device._id);
    expect(query[`addresses.${SupportedWalletChain.multi}`]).toBeInstanceOf(
      RegExp,
    );
    expect(
      query[`addresses.${SupportedWalletChain.multi}`].test(evmAddress),
    ).toBe(true);
    expect(
      query[`addresses.${SupportedWalletChain.multi}`].test(
        evmAddress.toUpperCase(),
      ),
    ).toBe(true);
    expect(req.walletAddress).toBe(evmAddress);
    expect(req.walletChain).toBe(SupportedWalletChain.multi);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects a wallet address that does not belong to the device', async () => {
    const device = {
      _id: 'device-1',
    };
    deviceService.findOne.mockResolvedValue(device);
    walletRepository.findOne.mockResolvedValue(null);
    const token = jwtService.sign({ _id: device._id }, { expiresIn: '1h' });
    const req: any = {
      method: 'POST',
      path: '/api/v1/moonpay/link',
      headers: {
        'x-auth-device-token': token,
        'x-wallet-address': 'GABC123',
      },
      body: {
        wallet: 'GABC123',
      },
    };

    await expect(middleware.use(req, {} as any, jest.fn())).rejects.toThrow(
      'Wallet does not belong to device',
    );
  });

  it('rejects a request body wallet that does not match the owned header wallet', async () => {
    const device = {
      _id: 'device-1',
    };
    const wallet = {
      _id: 'wallet-1',
      deviceId: device._id,
    };
    deviceService.findOne.mockResolvedValue(device);
    walletRepository.findOne.mockResolvedValue(wallet);
    const token = jwtService.sign({ _id: device._id }, { expiresIn: '1h' });
    const req: any = {
      method: 'POST',
      path: '/api/v1/banxa/create-sell-order',
      headers: {
        'x-auth-device-token': token,
        'x-wallet-address': 'GABC123',
      },
      body: {
        walletAddress: 'GDIFFERENT',
      },
    };

    await expect(middleware.use(req, {} as any, jest.fn())).rejects.toThrow(
      'Wallet address does not match request',
    );
  });
});
