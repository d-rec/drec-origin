// Force typeorm 0.3.x to create the global MetadataArgsStorage BEFORE
// any @energyweb packages (which depend on typeorm 0.2.x) get a chance to.
// Both versions share the same globalScope.typeormMetadataArgsStorage key;
// whichever version creates it first wins.  0.3.x adds methods like
// filterForeignKeys that the EntityMetadataBuilder needs at startup.
import { getMetadataArgsStorage } from 'typeorm';
getMetadataArgsStorage();

import { startAPI } from '.';
import { createNestWinstonLogger } from './logger';

process.setMaxListeners(0);

const logger = createNestWinstonLogger();

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

startAPI(logger);
