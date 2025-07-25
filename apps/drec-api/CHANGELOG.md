# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.6.0](https://github.com/d-rec/drec-origin/compare/v0.5.0...v0.6.0) (2025-07-21)

### Features

- enable profiling via env variable ([b365198](https://github.com/d-rec/drec-origin/commit/b3651986f547f7f6d60af77299e8db9d682a732e))
- queue creat missing cycles ([b0e66f3](https://github.com/d-rec/drec-origin/commit/b0e66f37246accf970346954577141f433432da8))
- run missing cycle check in sequence ([59cf0ec](https://github.com/d-rec/drec-origin/commit/59cf0ecd4b2a8d13aec0267269e69e7836c88ec8))

### Bug Fixes

- add missing db host in config ([b7b378f](https://github.com/d-rec/drec-origin/commit/b7b378f558fb2f2d27139c426d302bef948c28c6))
- converting into watts for certificate logs ([7ce029e](https://github.com/d-rec/drec-origin/commit/7ce029eb960371a8ff05e7cc80e4ddded480f0d5))
- cycles generation inconsistencies ([#653](https://github.com/d-rec/drec-origin/issues/653)) ([af37011](https://github.com/d-rec/drec-origin/commit/af3701139776c5a5856c238fbb0e9c6575839e99))
- handle async and non async function in the profiler ([a335bdf](https://github.com/d-rec/drec-origin/commit/a335bdf2aaf606134174cb43166d7b6b7be57932))
- invalid issuance minimum data ([#668](https://github.com/d-rec/drec-origin/issues/668)) ([8fb9121](https://github.com/d-rec/drec-origin/commit/8fb9121eb0649d4c8b0aa8753de2f248d6da3c06))
- invalid total read calculation per device ([5e836cb](https://github.com/d-rec/drec-origin/commit/5e836cbbf2301dc0390ea44351dfce3b49e15b75))
- minimum date calculation for issuance ([#670](https://github.com/d-rec/drec-origin/issues/670)) ([6c69ab0](https://github.com/d-rec/drec-origin/commit/6c69ab0749ade35719d5572f30e8c5e054508062))
- using current date as an end date ([2c590d6](https://github.com/d-rec/drec-origin/commit/2c590d669314e8ce0fab63b3b09787eae707e4bf))

### Improvements

- add code profiler ([#649](https://github.com/d-rec/drec-origin/issues/649)) ([be19ac0](https://github.com/d-rec/drec-origin/commit/be19ac0073252347dde51542d5e0b87e9562cd54))
- change min date calculation to minute ([c0a584c](https://github.com/d-rec/drec-origin/commit/c0a584c87998755432edc2c79ae4204091c29bd0))
- cleanup ([133a093](https://github.com/d-rec/drec-origin/commit/133a0939243fadbd3b0adef09e82314f6509c720))
- cleanup ([b2a832b](https://github.com/d-rec/drec-origin/commit/b2a832b73b333fd49900d50c78659ecabaf0b5c9))
- cleanup ([836bd2c](https://github.com/d-rec/drec-origin/commit/836bd2c17049980667b5174fe10b07d09ebbc2bd))
- fix linting issues ([b91d161](https://github.com/d-rec/drec-origin/commit/b91d161542faf1d62d419524be31b483e5cafe9b))
- prevent updating cycle date ([2cbadec](https://github.com/d-rec/drec-origin/commit/2cbadec7ac83a99aae2f0511d8cad5e15a86eb65))
- profile the fetching of cycles ([8a42c5a](https://github.com/d-rec/drec-origin/commit/8a42c5ac8c3b03f224b5c978f1fdbfbe88f8e2ad))
- remove redudant fetch on create ([cd66c84](https://github.com/d-rec/drec-origin/commit/cd66c84f5f9193771d3c6881b7feb8feea375bd7))

## [0.5.0](https://github.com/d-rec/drec-origin/compare/v0.4.4...v0.5.0) (2025-06-16)

### Features

- add database replication routing connection ([#628](https://github.com/d-rec/drec-origin/issues/628)) ([9fd8a07](https://github.com/d-rec/drec-origin/commit/9fd8a071058a6f04da7f71d6cb7809c120650d53))
- hide verbose logs from the service logs ([ca387a9](https://github.com/d-rec/drec-origin/commit/ca387a91bae8d42dd7881bdfe8ea471504642e12))

### Improvements

- cleanup logs ([95fd9d6](https://github.com/d-rec/drec-origin/commit/95fd9d6b9ac088a31a84f5f88ab3f75a0b864d98))
- log reads ([cff1a2d](https://github.com/d-rec/drec-origin/commit/cff1a2d9c0497aeff9f878cd6c5bf83067580381))
- log reads ([2a1a89a](https://github.com/d-rec/drec-origin/commit/2a1a89a4f1e431ab7b7a84932d9d384f1342f170))
- logs cleanup ([acb28d8](https://github.com/d-rec/drec-origin/commit/acb28d80d00604575f2bfe4b3ebe43aaa01d492a))

### [0.4.4](https://github.com/d-rec/drec-origin/compare/v0.4.3...v0.4.4) (2025-05-29)

### Features

- create device indexes for lateongoing certificates ([#624](https://github.com/d-rec/drec-origin/issues/624)) ([5eb8dc8](https://github.com/d-rec/drec-origin/commit/5eb8dc8043683ffe8ba4e370674280879dd4816c))

### [0.4.3](https://github.com/d-rec/drec-origin/compare/v0.4.2...v0.4.3) (2025-05-26)

### Bug Fixes

- add error handling for empty certificate logs ([d761e18](https://github.com/d-rec/drec-origin/commit/d761e18fc05e0043c9bc1dee886a93a228091ea1))

### [0.4.2](https://github.com/d-rec/drec-origin/compare/v0.4.1...v0.4.2) (2025-05-13)

### Bug Fixes

- issue valid device calculation ([c7ee189](https://github.com/d-rec/drec-origin/commit/c7ee18945d5d6c261e8069aa9635c422940c602e))

### Improvements

- temporary disable issuance ([3222767](https://github.com/d-rec/drec-origin/commit/32227673ff86f3e2403fa7a7c448bbc4506abd7e))

### [0.4.1](https://github.com/d-rec/drec-origin/compare/v0.4.0...v0.4.1) (2025-05-13)

### Bug Fixes

- token issuance transaction ([d5aa5ab](https://github.com/d-rec/drec-origin/commit/d5aa5ab8c0520723d30717ca2dfdbc2ea8299785))

### Improvements

- log device value calculation ([e0de163](https://github.com/d-rec/drec-origin/commit/e0de163270488f04964eb2919cbf461b3982b24b))

## [0.4.0](https://github.com/d-rec/drec-origin/compare/v0.3.2...v0.4.0) (2025-05-13)

### Features

- Add terms and condition ([#548](https://github.com/d-rec/drec-origin/issues/548)) ([b7d0e3c](https://github.com/d-rec/drec-origin/commit/b7d0e3c2d6cd96ef67c0c7c053062a79f6c44a00))
- archive outdated late ongoing cycles ([#569](https://github.com/d-rec/drec-origin/issues/569)) ([0a9311c](https://github.com/d-rec/drec-origin/commit/0a9311ce061f2759c7dbccb43ff97e6cc6d703de))
- improve documentation ([#568](https://github.com/d-rec/drec-origin/issues/568)) ([853a7b2](https://github.com/d-rec/drec-origin/commit/853a7b27a301c0c0925988712e1dee1bda13ba1e))

### Bug Fixes

- naming for avoid confusion ([#527](https://github.com/d-rec/drec-origin/issues/527)) ([4756284](https://github.com/d-rec/drec-origin/commit/47562842d177c96ba92691f6dadbe3c295cf917c))

### Improvements

- cleanup ([d2d3afb](https://github.com/d-rec/drec-origin/commit/d2d3afb9702ed2b4f71d50276c3a07646c18a9fa))
- cleanup historical reads service ([a6701ae](https://github.com/d-rec/drec-origin/commit/a6701aeb7e60d7f431d0db19e017382e66eff3d1))
- fix linting config ([25012cc](https://github.com/d-rec/drec-origin/commit/25012ccdbb8316445b3772999901898f26ffee5b))
- fix linting issues ([6cd9376](https://github.com/d-rec/drec-origin/commit/6cd93769c782032ff5cfbdfa840003035055597f))
- fix terms accepted at column name ([9b2082e](https://github.com/d-rec/drec-origin/commit/9b2082eb572db0e932bb91efbd71ae428b038ee5))
- improve the check missing cycles logic ([d3e7e56](https://github.com/d-rec/drec-origin/commit/d3e7e566dc57ff06cf8687c0b1ca71eab6de4cb5))
- Issuer service and divide Issuing process into dedicated files ([#562](https://github.com/d-rec/drec-origin/issues/562)) ([5bb9a53](https://github.com/d-rec/drec-origin/commit/5bb9a5392af987ff37a30ad90220ba493bd2a076)), closes [#561](https://github.com/d-rec/drec-origin/issues/561)
- store existing registry and issuer in the database ([810aff0](https://github.com/d-rec/drec-origin/commit/810aff02e55401ca4eb3b93c70041c94a0a57c29))

### [0.3.2](https://github.com/d-rec/drec-origin/compare/v0.3.1...v0.3.2) (2025-04-24)

### Features

- add root route handler ([#573](https://github.com/d-rec/drec-origin/issues/573)) ([4a936d8](https://github.com/d-rec/drec-origin/commit/4a936d87fa7d40ed30f5cafb697acc6eef295fe7))

### Improvements

- add missing changelog ([e8d2f13](https://github.com/d-rec/drec-origin/commit/e8d2f13bfb648c78411058beb6ab4ad924e50a75))

### [0.3.1](https://github.com/d-rec/drec-origin/compare/v0.3.0...v0.3.1) (2025-04-23)

### Bug Fixes

- prevent cron reentry ([#571](https://github.com/d-rec/drec-origin/issues/571)) ([5441f29](https://github.com/d-rec/drec-origin/commit/5441f29b4b54ccbaeabfc29897c9f4c167fdd3e8))

## [0.3.0](https://github.com/d-rec/drec-origin/compare/v0.1.3...v0.3.0) (2025-04-22)

### Features

- add and integrate Redocly library for documenting api endpoints… ([#520](https://github.com/d-rec/drec-origin/issues/520)) ([fb4dbea](https://github.com/d-rec/drec-origin/commit/fb4dbea3fe49cdbc25a5e430971623de31eb81bd))
- add certificate generation requirement on the documentation ([#551](https://github.com/d-rec/drec-origin/issues/551)) ([f08967b](https://github.com/d-rec/drec-origin/commit/f08967bca78ab93914110dd4603357642d0dd1ea))
- add cron jobs ([#523](https://github.com/d-rec/drec-origin/issues/523)) ([8701f2c](https://github.com/d-rec/drec-origin/commit/8701f2c3e94181f245904e6cb3c08b6c5ec28e11))
- add dependency md file ([#519](https://github.com/d-rec/drec-origin/issues/519)) ([6004c1d](https://github.com/d-rec/drec-origin/commit/6004c1da0108c445041625f06c292cd9fd56efd1))
- create organization type enum ([#544](https://github.com/d-rec/drec-origin/issues/544)) ([a8274d4](https://github.com/d-rec/drec-origin/commit/a8274d4c727a7dd78e45a5800b2447a177020442))
- load late ongoing queries in parallel ([1de8328](https://github.com/d-rec/drec-origin/commit/1de8328dca154f6ee904ce2c999173d6fc4c2733))
- trigger the late ongoing issuance in a queue ([46d0623](https://github.com/d-rec/drec-origin/commit/46d06231c48b87de032928d9c006c6fe2579118d))

### Bug Fixes

- organizationType import ([#550](https://github.com/d-rec/drec-origin/issues/550)) ([fc8255f](https://github.com/d-rec/drec-origin/commit/fc8255f0c195a29d1838dd074bc08f279bb6b78c))
- redocly loading delay ([95a53e8](https://github.com/d-rec/drec-origin/commit/95a53e8439426737804c25f67ce9c4749fb2d0a0))

### Improvements

- add SDG Benefits and Off Takers to the documentation ([#522](https://github.com/d-rec/drec-origin/issues/522)) ([9591b30](https://github.com/d-rec/drec-origin/commit/9591b30dffe898f50b8539277600198f519cd4af))
- console log http 500 error only ([e316a8d](https://github.com/d-rec/drec-origin/commit/e316a8d3aa861f070a6b9fae0c18c2e40fac766f))
- fix linting config ([5fb8b82](https://github.com/d-rec/drec-origin/commit/5fb8b82c77280d3f977f2b07d23f6d02c214f999))
- reduce timeout between late ongoing processing ([f0bf022](https://github.com/d-rec/drec-origin/commit/f0bf022bd9f36b5c946f696dbcda707fea274254))
- **release:** 0.2.0 ([0580404](https://github.com/d-rec/drec-origin/commit/0580404ed50c92b005849aab54a7d76b3eec3099))
- show progress in terminal ([70eaa61](https://github.com/d-rec/drec-origin/commit/70eaa6172164436aa551351044fedccfdfe4ecf0))
- temporary disable the late ongoing cronjob ([5175126](https://github.com/d-rec/drec-origin/commit/5175126eb1f477c6c729291729a2cf62ab5e79e4))

## [0.2.0](https://github.com/d-rec/drec-origin/compare/v0.1.2...v0.2.0) (2025-04-10)

### Features

- load late ongoing queries in parallel ([1de8328](https://github.com/d-rec/drec-origin/commit/1de8328dca154f6ee904ce2c999173d6fc4c2733))
- trigger the late ongoing issuance in a queue ([46d0623](https://github.com/d-rec/drec-origin/commit/46d06231c48b87de032928d9c006c6fe2579118d))

### Improvements

- add standard versioning ([f98d72e](https://github.com/d-rec/drec-origin/commit/f98d72ede10656f4c5ffa9b1f387aaf878f2ee39))
- console log http 500 error only ([e316a8d](https://github.com/d-rec/drec-origin/commit/e316a8d3aa861f070a6b9fae0c18c2e40fac766f))
- ignore changelog in markdown lint ([a1c045e](https://github.com/d-rec/drec-origin/commit/a1c045e1e7bc2a36fb69c4d67a0d31a57a14c9e6))
- reduce timeout between late ongoing processing ([f0bf022](https://github.com/d-rec/drec-origin/commit/f0bf022bd9f36b5c946f696dbcda707fea274254))
- **release:** 0.1.3 ([d859e8f](https://github.com/d-rec/drec-origin/commit/d859e8fb8955bb2e088672c6481fc2e208701b8f))
- **sentry:** merge sentry filter with global filter ([#555](https://github.com/d-rec/drec-origin/issues/555)) ([b6b1b5e](https://github.com/d-rec/drec-origin/commit/b6b1b5e9293f88656e380b51b9cfcda5b98b9387))
- show progress in terminal ([70eaa61](https://github.com/d-rec/drec-origin/commit/70eaa6172164436aa551351044fedccfdfe4ecf0))
- temporary disable the late ongoing cronjob ([5175126](https://github.com/d-rec/drec-origin/commit/5175126eb1f477c6c729291729a2cf62ab5e79e4))

### [0.1.3](https://github.com/d-rec/drec-origin/compare/v0.1.2...v0.1.3) (2025-04-05)

### Improvements

- add standard versioning ([f98d72e](https://github.com/d-rec/drec-origin/commit/f98d72ede10656f4c5ffa9b1f387aaf878f2ee39))
- ignore changelog in markdown lint ([a1c045e](https://github.com/d-rec/drec-origin/commit/a1c045e1e7bc2a36fb69c4d67a0d31a57a14c9e6))
- **sentry:** merge sentry filter with global filter ([#555](https://github.com/d-rec/drec-origin/issues/555)) ([b6b1b5e](https://github.com/d-rec/drec-origin/commit/b6b1b5e9293f88656e380b51b9cfcda5b98b9387))

### [0.1.2](https://github.com/d-rec/drec-origin/compare/v0.1.1...v0.1.2) (2025-04-01)

### Bug Fixes

- sentry activation issue ([f9df80c](https://github.com/d-rec/drec-origin/commit/f9df80c1770073aa658f8c571a00934b4e1926a9))

### [0.1.1](https://github.com/d-rec/drec-origin/compare/v0.1.0...v0.1.1) (2025-04-01)

### Features

- Add a new platform overview section ([#497](https://github.com/d-rec/drec-origin/issues/497)) ([f1a23a1](https://github.com/d-rec/drec-origin/commit/f1a23a1f3b51979ab4a759be6a8a0dd634677f2c))
- Add bug and feature request issue forms ([#475](https://github.com/d-rec/drec-origin/issues/475)) ([2ca30a7](https://github.com/d-rec/drec-origin/commit/2ca30a7021b41a5d78de916dba2c42d66d4a9674))
- Add dummy data seeds ([#499](https://github.com/d-rec/drec-origin/issues/499)) ([4100ed3](https://github.com/d-rec/drec-origin/commit/4100ed360f768354d9742eaa1f1ce17e972dddb7)), closes [#463](https://github.com/d-rec/drec-origin/issues/463) [#451](https://github.com/d-rec/drec-origin/issues/451)
- Add fuel and device types codes on documentation ([#517](https://github.com/d-rec/drec-origin/issues/517)) ([6cadecd](https://github.com/d-rec/drec-origin/commit/6cadecd1371c43cbd35f5aaef3549277966894cb))
- Add iso_8601 format ([#518](https://github.com/d-rec/drec-origin/issues/518)) ([f1020f8](https://github.com/d-rec/drec-origin/commit/f1020f86f22896f2b24081ec715a41ffc98545d1))
- Create permission seeder ([#501](https://github.com/d-rec/drec-origin/issues/501)) ([6f09bbb](https://github.com/d-rec/drec-origin/commit/6f09bbb8bb03fe1f9058ef288e47407f6d8ec7a8))
- GitHub pipeline to build docker image ([#445](https://github.com/d-rec/drec-origin/issues/445)) ([d7519ba](https://github.com/d-rec/drec-origin/commit/d7519baf5fdc5dcce515be3a4cf2fd0961699777))
- Improve-device-bulk-upload-error ([#500](https://github.com/d-rec/drec-origin/issues/500)) ([a9f2008](https://github.com/d-rec/drec-origin/commit/a9f200864f54066b41fadd62a7191cf31db119e7))
- Remove hardcoded jwt_secret ([#480](https://github.com/d-rec/drec-origin/issues/480)) ([69b9287](https://github.com/d-rec/drec-origin/commit/69b9287dcd21ed4f55b3eb17f21bf996a380019d))
- Sentry integration ([#470](https://github.com/d-rec/drec-origin/issues/470)) ([ecd27c6](https://github.com/d-rec/drec-origin/commit/ecd27c693e6efc32ec53eb666fe0bdf23eb7b1cd))
- Storing failed meter reads ([#451](https://github.com/d-rec/drec-origin/issues/451)) ([d16c6c2](https://github.com/d-rec/drec-origin/commit/d16c6c2fe1a0eeeb58f5060e790f6d23ca16eb2f))
- Bulk upload job refactoring ([9d96866](https://github.com/d-rec/drec-origin/commit/9d96866e6944e4ccbb7ca84c70f02192aba7c7da))

### Bug Fixes

- Date range from year tests ([f64099b](https://github.com/d-rec/drec-origin/commit/f64099b7dc306bc9af7ec7280acb8096933d753e))
- Fix gh pages deployment pipeline ([d88ec84](https://github.com/d-rec/drec-origin/commit/d88ec84986e1eb555955da19530775989e95713e))
- Invalid offset error on redemption report ([#541](https://github.com/d-rec/drec-origin/issues/541)) ([5f77896](https://github.com/d-rec/drec-origin/commit/5f7789666e1fc1e9b7fa263c6bbd5fc1e4fa9331))
- Meter reads endpoint ([7c3adb6](https://github.com/d-rec/drec-origin/commit/7c3adb6a8a2e7f2e72a082e41719c55dc8d776b9))
- Missing tsconfig-paths library ([21dab73](https://github.com/d-rec/drec-origin/commit/21dab73dae2ae44d996ed76bd2d6ef39339ca875))
- OrganizationId handling ([ff0031f](https://github.com/d-rec/drec-origin/commit/ff0031fe427fdcc22b8839baca648e08c5a0bf96))
- Reset password invalid link error ([#493](https://github.com/d-rec/drec-origin/issues/493)) ([de8b9f2](https://github.com/d-rec/drec-origin/commit/de8b9f265b586b10939a93bea55a231c06493c0c))
- Unhandled errors ([f3e3480](https://github.com/d-rec/drec-origin/commit/f3e3480575207a0debaf211bc3df4fe6c0b6caa2))
- Validation error for bulk device upload ([#509](https://github.com/d-rec/drec-origin/issues/509)) ([8c17a0d](https://github.com/d-rec/drec-origin/commit/8c17a0da51a13da9a91a63b6bc92251a42497f38))
