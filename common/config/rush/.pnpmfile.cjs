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
    'cross-spawn': '>=7.0.5',
    'elliptic': '>=6.6.1',
    'flatted': '>=3.4.2',
    'form-data': '>=4.0.4',
    'js-yaml': '>=3.13.1',
    'jsonwebtoken': '>=9.0.0',
    'jws': '>=3.2.3',
    'minimatch': '~3.1.4',
    'moment': '>=2.29.4',
    'path-to-regexp': '>=0.1.12',
    'pbkdf2': '>=3.1.3',
    'picomatch': '>=2.3.2',
    'qs': '>=6.9.7',
    'serialize-javascript': '>=6.0.2',
    'sha.js': '>=2.4.12',
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

  return packageJson;
}
