import {createLogger, transports, format} from 'winston';

const stackTraceFormat = format(info => {
    if (info.err)
        info.message = `${info.message}: ${info.err.stack}`;
    return info;
});

const logger = createLogger({
    transports: [
        new transports.Console({
            level: process.env.IIIF_IMAGE_LOG_LEVEL,
            handleExceptions: true,
            format: format.combine(
                format.colorize(),
                stackTraceFormat(),
                format.timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
                format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
            )
        })
    ],
    exitOnError: false
});

// @ts-ignore
logger.emitErrs = false;

logger.stream = {
    // @ts-ignore
    write: function (message: string): void {
        logger.debug(message.trim());
    }
};

export default logger;
