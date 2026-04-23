/**
 * Shim for Node.js 22+ which removed deprecated util.is* functions.
 * Old @nestjs packages (bull@0.4.2, config@1.0.1, schedule@1.0.1)
 * use these removed functions.
 *
 * Usage: node --require ./node-compat-shim.js dist/js/src/main
 */
'use strict';

const util = require('util');

if (typeof util.isString !== 'function') {
  util.isString = function isString(arg) {
    return typeof arg === 'string';
  };
}

if (typeof util.isObject !== 'function') {
  util.isObject = function isObject(arg) {
    return arg !== null && typeof arg === 'object';
  };
}

if (typeof util.isFunction !== 'function') {
  util.isFunction = function isFunction(arg) {
    return typeof arg === 'function';
  };
}

if (typeof util.isUndefined !== 'function') {
  util.isUndefined = function isUndefined(arg) {
    return arg === undefined;
  };
}

if (typeof util.isNullOrUndefined !== 'function') {
  util.isNullOrUndefined = function isNullOrUndefined(arg) {
    return arg === null || arg === undefined;
  };
}

/**
 * TypeORM 0.2→0.3 compatibility shim.
 *
 * Both typeorm 0.2.41 (used by @energyweb packages) and 0.3.28 (app)
 * share a single global MetadataArgsStorage via globalThis.typeormMetadataArgsStorage.
 * If 0.2.41 creates the instance first, it lacks the `filterForeignKeys` method
 * and `foreignKeys` property that 0.3.28's EntityMetadataBuilder expects.
 *
 * We hook into Module._load to patch the storage as soon as typeorm is loaded.
 */
const Module = require('module');
const originalLoad = Module._load;
let typeormPatched = false;

Module._load = function (request, parent, isMain) {
  const result = originalLoad.apply(this, arguments);

  if (!typeormPatched && request === 'typeorm') {
    typeormPatched = true;
    try {
      const storage = result.getMetadataArgsStorage
        ? result.getMetadataArgsStorage()
        : null;
      if (storage && !storage.foreignKeys) {
        storage.foreignKeys = [];
      }
      if (storage && typeof storage.filterForeignKeys !== 'function') {
        storage.filterForeignKeys = function filterForeignKeys(target) {
          return this.foreignKeys.filter(function (fk) {
            return Array.isArray(target)
              ? target.indexOf(fk.target) !== -1
              : fk.target === target;
          });
        };
      }
      // Also patch the prototype so future instances get it
      const proto = Object.getPrototypeOf(storage);
      if (proto && !proto.filterForeignKeys) {
        proto.foreignKeys = proto.foreignKeys || [];
        proto.filterForeignKeys = function filterForeignKeys(target) {
          return this.foreignKeys.filter(function (fk) {
            return Array.isArray(target)
              ? target.indexOf(fk.target) !== -1
              : fk.target === target;
          });
        };
      }
    } catch (e) {
      // Ignore — non-critical
    }
  }

  return result;
};
