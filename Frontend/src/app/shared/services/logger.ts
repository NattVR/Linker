/*
 * Linker - Proyecto Universitario
 * Copyright (C) 2024 Linker. All rights reserved.
 */
import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class LoggerService {
    log(message: string): void {
        console.info(`[INFO] ${new Date().toISOString()} - ${message}`);
    }

    error(message: string, meta?: unknown): void {
        if (meta === undefined) {
            console.info(`[ERROR] ${new Date().toISOString()} - ${message}`);
        } else if (meta instanceof Error) {
            console.info(`[ERROR] ${new Date().toISOString()} - ${message}`, {
                error: meta.message,
                stack: meta.stack
            });
        } else if (typeof meta === 'object' && meta !== null) {
            console.info(`[ERROR] ${new Date().toISOString()} - ${message}`, meta);
        } else if (
            typeof meta === 'string' ||
            typeof meta === 'number' ||
            typeof meta === 'boolean'
        ) {
            console.info(`[ERROR] ${new Date().toISOString()} - ${message}`, { detail: meta });
        } else {
            console.info(`[ERROR] ${new Date().toISOString()} - ${message}`);
        }
    }
}