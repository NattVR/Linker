import { Injectable } from '@angular/core';
import * as winston from 'winston';

@Injectable({
    providedIn: 'root'
})
export class LoggerService {
    private readonly logger: winston.Logger;

    constructor() {
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            transports: [
                new winston.transports.Console()
            ],
        });
    }

    log(message: string): void {
        this.logger.info(message);
    }

    error(message: string, meta?: unknown): void {
        if (meta === undefined) {
            this.logger.error(message);
        } else if (meta instanceof Error) {
            this.logger.error(message, { error: meta.message, stack: meta.stack });
        } else if (typeof meta === 'object' && meta !== null) {
            this.logger.error(message, meta);
        } else if (
            typeof meta === 'string' ||
            typeof meta === 'number' ||
            typeof meta === 'boolean'
        ) {
            this.logger.error(message, { detail: meta });
        } else {
            this.logger.error(message);
        }
    }
}