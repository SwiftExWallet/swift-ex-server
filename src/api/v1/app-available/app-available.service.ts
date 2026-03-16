import { Injectable, Logger } from "@nestjs/common";
import { GeoLiteIpService } from "./geo-lite-Ip.service";

@Injectable()
export class AppAvailableService {
    private readonly logger = new Logger(AppAvailableService.name);
    constructor(
        private readonly geoLiteIpService: GeoLiteIpService
    ) { }

    async checkAppAvailability(appAvailableDto:any): Promise<any> {
        return this.geoLiteIpService.checkIp(appAvailableDto);
    }
}