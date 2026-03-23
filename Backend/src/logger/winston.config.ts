import * as winston from 'winston';

const TIMESTAMP_FORMAT = 'YYYY-MM-DD HH:mm:ss';

function formatContext(context: unknown): string {
    if (context == null) {
        return 'App';
    }
    if (typeof context === 'object') {
        return JSON.stringify(context);
    }
    if (typeof context === 'string') {
        return context;
    }
    if (typeof context === 'number' || typeof context === 'boolean') {
        return context.toString();
    }
    return 'App';
}

const consoleFormat = winston.format.printf(
    ({ timestamp, level, message, context }) =>
        `[${timestamp}] ${level} [${formatContext(context)}]: ${message}`,
);

export const winstonTransports = [
    new winston.transports.Console({
        format: winston.format.combine(
            winston.format.timestamp({ format: TIMESTAMP_FORMAT }),
            winston.format.colorize(),
            consoleFormat,
        ),
    }),
    new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
            winston.format.timestamp({ format: TIMESTAMP_FORMAT }),
            winston.format.json(),
        ),
    }),
    new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(
            winston.format.timestamp({ format: TIMESTAMP_FORMAT }),
            winston.format.json(),
        ),
    }),
];