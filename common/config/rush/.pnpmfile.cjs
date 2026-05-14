'use strict';

/**
 * When using the PNPM package manager, you can use pnpmfile.js to workaround
 * dependencies that have mistakes in their package.json file.  (This feature is
 * functionally similar to Yarn's "resolutions".)
 *
 * For details, see the PNPM documentation:
 * https://pnpm.js.org/docs/en/hooks.html
 *
 * IMPORTANT: SINCE THIS FILE CONTAINS EXECUTABLE CODE, MODIFYING IT IS LIKELY TO INVALIDATE
 * ANY CACHED DEPENDENCY ANALYSIS.  After any modification to pnpmfile.js, it's recommended to run
 * "rush update --full" so that PNPM will recalculate all version selections.
 */
module.exports = {
  hooks: {
    readPackage
  }
};

/**
 * This hook is invoked during installation before a package's dependencies
 * are selected.
 * The `packageJson` parameter is the deserialized package.json
 * contents for the package that is about to be installed.
 * The `context` parameter provides a log() function.
 * The return value is the updated object.
 */
function readPackage(packageJson, context) {

  // // The karma types have a missing dependency on typings from the log4js package.
  // if (packageJson.name === '@types/karma') {
  //  context.log('Fixed up dependencies for @types/karma');
  //  packageJson.dependencies['log4js'] = '0.6.38';
  // }

  // ── Security overrides for transitive dependencies ──────────────────
  const securityOverrides = {
    'body-parser': '>=1.20.3',
    // class-validator: NOT overridden — @energyweb/origin-247-certificate
    // pins 0.13.2 and breaks under the stricter nested-validation rules
    // in 0.14+. The transitive-critical CVE doesn't apply to the way
    // @energyweb uses it (no untrusted input validated through that
    // path). Leaving the dashboard alert open is the lesser harm.
    'cross-spawn': '>=7.0.5',
    'elliptic': '>=6.6.1',
    'fast-uri': '>=3.1.2',
    'flatted': '>=3.4.2',
    'form-data': '>=4.0.4',
    'glob': '>=10.5.0',
    'js-yaml': '>=3.13.1',
    'jsonwebtoken': '>=9.0.0',
    'jws': '>=3.2.3',
    'lodash': '>=4.17.21',
    'lodash-es': '>=4.17.21',
    'minimatch': '~3.1.4',
    'moment': '>=2.29.4',
    'pbkdf2': '>=3.1.3',
    'picomatch': '>=2.3.2',
    'protobufjs': '>=7.5.6',
    'qs': '>=6.9.7',
    'rollup': '>=4.59.0',
    'serialize-javascript': '>=6.0.2',
    'sha.js': '>=2.4.12',
    'typeorm': '>=0.3.26',
    'uglify-js': '>=2.6.0',
    'underscore': '>=1.13.8',
    'validator': '>=13.15.22',
    'ws': '>=7.5.10',
  };

  for (const [pkg, version] of Object.entries(securityOverrides)) {
    if (packageJson.dependencies && packageJson.dependencies[pkg]) {
      packageJson.dependencies[pkg] = version;
    }
    if (packageJson.devDependencies && packageJson.devDependencies[pkg]) {
      packageJson.devDependencies[pkg] = version;
    }
  }

  // Express 4 needs path-to-regexp 0.x (function-based API).
  // Do NOT apply the global >=0.1.12 override — newer versions (8.x) are ESM
  // with a completely different API and break express routing.
  if (
    packageJson.name === 'express' &&
    packageJson.dependencies &&
    packageJson.dependencies['path-to-regexp']
  ) {
    packageJson.dependencies['path-to-regexp'] = '0.1.12';
  }

  return packageJson;
}
