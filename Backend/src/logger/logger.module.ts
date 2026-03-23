import { Module, Global } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { winstonTransports } from './winston.config';

@Global()
@Module({
    imports: [
        WinstonModule.forRoot({
            transports: winstonTransports,
        }),
    ],
    exports: [WinstonModule],
})
export class LoggerModule { }