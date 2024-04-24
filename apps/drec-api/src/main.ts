import { startAPI } from '.';
import { Logger } from '@nestjs/common';

// @ts-ignore
process.setMaxListeners(0);

const logger = new Logger();

// @ts-ignore
process.on('warning', (e) => {
  logger.warn('warning inside main.ts');
  logger.warn(e.stack);
});

/*
https://stackoverflow.com/questions/57115918/maxlistenersexceededwarning-possible-eventemitter-memory-leak-dete

(node:1) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 global:completed listeners added to [Queue]. Use emitter.setMaxListeners() to increase limit

got this in log when trying to issue 50 certificates
*/

startAPI();
