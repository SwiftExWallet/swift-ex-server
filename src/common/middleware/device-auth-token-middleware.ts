import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NestMiddleware,
  HttpException,
  HttpStatus,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DeviceService } from '../../api/v1/device/device.service';
import { Response, NextFunction } from 'express';
import { WalletRepository } from '../../api/v1/wallet/wallet.repository';
import { SupportedWalletChain } from '../enum/chain';
import { StrKey } from '@stellar/stellar-sdk';

const WALLET_ADDRESS_HEADER = 'x-wallet-address';

const WALLET_OWNERSHIP_ROUTES = [
  { method: 'DELETE', pattern: /^\/api\/v1\/wallet\/delete$/ },
  { method: 'GET', pattern: /^\/api\/v1\/wallet\/[^/]+\/address\/[^/]+$/ },
  { method: 'GET', pattern: /^\/api\/v1\/wallet\/[^/]+\/stellar$/ },
  { method: 'PATCH', pattern: /^\/api\/v1\/wallet\/[^/]+\/activate-wallet$/ },
  { method: 'PATCH', pattern: /^\/api\/v1\/wallet\/[^/]+\/assign-user$/ },
  { method: 'GET', pattern: /^\/api\/v1\/portfolio\/[^/]+$/ },
  { method: 'POST', pattern: /^\/api\/v1\/alchemy\/create-buy-order$/ },
  { method: 'POST', pattern: /^\/api\/v1\/alchemy\/create-sell-order$/ },
  { method: 'POST', pattern: /^\/api\/v1\/banxa\/create-buy-order$/ },
  { method: 'POST', pattern: /^\/api\/v1\/banxa\/create-sell-order$/ },
  { method: 'POST', pattern: /^\/api\/v1\/moonpay\/link$/ },
];

@Injectable()
export class DeviceAuthTokenMiddleware implements NestMiddleware {
  constructor(
    private jwtService: JwtService,
    private readonly deviceService: DeviceService,
    private readonly walletRepository: WalletRepository,
  ) {}

  async use(req: any, res: Response, next: NextFunction): Promise<any> {
    Logger.log('==== device auth middleware called ===');
    const token = req.headers['x-auth-device-token'];
    if (!token) {
      throw new NotFoundException('Device token  not found');
    }

    if (typeof token !== 'string' || !token.trim()) {
      throw new HttpException('Invalid Device', HttpStatus.FORBIDDEN);
    }

    let verifiedToken: any;
    try {
      verifiedToken = await this.jwtService.verifyAsync(token.trim());
    } catch {
      throw new HttpException('Invalid Device', HttpStatus.FORBIDDEN);
    }

    if (!verifiedToken?._id) {
      throw new HttpException('Invalid Device', HttpStatus.FORBIDDEN);
    }

    const device = await this.deviceService.findOne(verifiedToken._id);
    if (!device) {
      throw new HttpException('Invalid Device', HttpStatus.FORBIDDEN);
    }

    if (this.requiresWalletOwnershipCheck(req)) {
      const walletAddress = this.getWalletAddressFromHeader(req);
      if (!walletAddress) {
        throw new BadRequestException(
          `${WALLET_ADDRESS_HEADER} header is required`,
        );
      }

      const walletChain = this.getWalletChain(walletAddress);
      const wallet = await this.findDeviceWallet(
        walletAddress,
        walletChain,
        device._id,
      );
      if (!wallet) {
        throw new ForbiddenException('Wallet does not belong to device');
      }

      if (!this.requestTargetsWallet(req, walletAddress)) {
        throw new ForbiddenException('Wallet address does not match request');
      }

      req.wallet = wallet;
      req.walletAddress = walletAddress;
      req.walletChain = walletChain;
    }

    req.device = device;

    next();
  }

  private requiresWalletOwnershipCheck(req: any): boolean {
    const method = String(req.method ?? '').toUpperCase();
    const path = this.normalizePath(req.path ?? req.originalUrl ?? '');

    return WALLET_OWNERSHIP_ROUTES.some(
      (route) => route.method === method && route.pattern.test(path),
    );
  }

  private getWalletAddressFromHeader(req: any): string | null {
    const header = req.headers?.[WALLET_ADDRESS_HEADER];
    const value = Array.isArray(header) ? header[0] : header;

    if (typeof value !== 'string') {
      return null;
    }

    const walletAddress = value.trim();
    return walletAddress || null;
  }

  private async findDeviceWallet(
    walletAddress: string,
    walletChain: SupportedWalletChain,
    deviceId: any,
  ) {
    const escapedWalletAddress = this.escapeRegExp(walletAddress);
    const addressMatcher =
      walletChain === SupportedWalletChain.xlm
        ? walletAddress
        : new RegExp(`^${escapedWalletAddress}$`, 'i');

    return this.walletRepository.findOne({
      deviceId,
      [`addresses.${walletChain}`]: addressMatcher,
    });
  }

  private getWalletChain(walletAddress: string): SupportedWalletChain {
    return StrKey.isValidEd25519PublicKey(walletAddress)
      ? SupportedWalletChain.xlm
      : SupportedWalletChain.multi;
  }

  private requestTargetsWallet(req: any, walletAddress: string): boolean {
    const targetWalletAddresses = this.getTargetWalletAddresses(req);

    if (targetWalletAddresses.length === 0) {
      return true;
    }

    return targetWalletAddresses.some((targetAddress) =>
      this.walletAddressesMatch(targetAddress, walletAddress),
    );
  }

  private getTargetWalletAddresses(req: any): string[] {
    const body = req.body ?? {};
    const path = this.normalizePath(req.path ?? req.originalUrl ?? '');
    const candidates = [
      body.walletAddress,
      body.wallet,
      body.address,
      ...this.getAddressValues(body.addresses),
      ...this.getPathWalletAddresses(path),
    ];

    return candidates
      .filter((candidate): candidate is string => typeof candidate === 'string')
      .map((candidate) => candidate.trim())
      .filter(Boolean);
  }

  private getAddressValues(addresses: unknown): string[] {
    if (
      !addresses ||
      typeof addresses !== 'object' ||
      Array.isArray(addresses)
    ) {
      return [];
    }

    return Object.values(addresses).filter(
      (address): address is string => typeof address === 'string',
    );
  }

  private getPathWalletAddresses(path: string): string[] {
    const matches = [
      path.match(/^\/api\/v1\/portfolio\/([^/]+)$/),
      path.match(/^\/api\/v1\/wallet\/[^/]+\/address\/([^/]+)$/),
      path.match(/^\/api\/v1\/wallet\/([^/]+)\/stellar$/),
      path.match(/^\/api\/v1\/wallet\/([^/]+)\/activate-wallet$/),
      path.match(/^\/api\/v1\/wallet\/([^/]+)\/assign-user$/),
    ];

    return matches
      .map((match) => match?.[1])
      .filter((address): address is string => Boolean(address))
      .map((address) => this.decodePathSegment(address));
  }

  private normalizePath(path: string): string {
    const normalizedPath = path.split('?')[0]?.replace(/\/+$/, '');
    return normalizedPath || '/';
  }

  private decodePathSegment(value: string): string {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  private walletAddressesMatch(first: string, second: string): boolean {
    return first.trim().toLowerCase() === second.trim().toLowerCase();
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
