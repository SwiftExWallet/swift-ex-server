import { Controller, Get} from "@nestjs/common";
import { AppAvailableService } from "./app-available.service";
import { ClientIp } from "./ip.decorator";

@Controller('api/v1/app-available')
export class AppAvailable {
    constructor(private readonly appAvailableService: AppAvailableService) { }

    @Get('/')
    async checkAppAvailability(
        @ClientIp() ip: string
    ) {
        console.log('===== user Ip address =====',ip);
        const result = await this.appAvailableService.checkAppAvailability(ip);
        return {
            ...result,
            maintenance: process.env.MAINTENANCE
        }
    }
}