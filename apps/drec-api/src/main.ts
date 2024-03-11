import { startAPI } from '.';

//@ts-ignore
process.setMaxListeners(0);

//@ts-ignore
process.on('warning', (e) => {
  console.warn('warning inside main.ts');
  console.warn(e.stack);
});

/*
https://stackoverflow.com/questions/57115918/maxlistenersexceededwarning-possible-eventemitter-memory-leak-dete

(node:1) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 global:completed listeners added to [Queue]. Use emitter.setMaxListeners() to increase limit

got this in log when trying to issue 50 certificates
*/

startAPI();
