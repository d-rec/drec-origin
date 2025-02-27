import { startAPI } from '.';
import { Logger } from '@nestjs/common';

process.setMaxListeners(0);

const logger = new Logger();

process.on('warning', (e) => {
  logger.warn(e.stack);
});

process.on('unhandledException', (e) => {
  logger.error('Unhandled Exception');
  logger.error(e.stack);
});

process.on('unhandledRejection', (e: Error) => {
  logger.error('Unhandled Rejection');
  logger.error(e?.stack || e);
});
/*
https://stackoverflow.com/questions/57115918/maxlistenersexceededwarning-possible-eventemitter-memory-leak-dete

(node:1) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 global:completed listeners added to [Queue]. Use emitter.setMaxListeners() to increase limit

got this in log when trying to issue 50 certificates
*/

startAPI();
