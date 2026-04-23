import { Global, Module } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

/**
 * Compatibility shim: @energyweb/origin-247-certificate@4.1.5 expects
 * an ENTITY_MANAGER provider (Symbol.for('ENTITY_MANAGER')) backed by
 * typeorm 0.2's EntityManager class. In typeorm 0.3 EntityManager is
 * no longer auto-registered as a NestJS provider.
 *
 * The library's OffChainCertificateModule uses
 *   { provide: ENTITY_MANAGER, useExisting: EntityManager }
 * where EntityManager is the class from typeorm 0.2.x (the library's
 * own dependency). This app uses typeorm 0.3.x, so the two
 * EntityManager classes are different object references.
 *
 * We resolve the 0.2.x EntityManager class at runtime and register
 * it as a provider so NestJS can satisfy the library's useExisting.
 */
const ENTITY_MANAGER = Symbol.for('ENTITY_MANAGER');

// Resolve the EntityManager class from the library's typeorm 0.2.x
// eslint-disable-next-line @typescript-eslint/no-var-requires
const certPkgPath = require.resolve(
  '@energyweb/origin-247-certificate/dist/js/src/offchain-certificate/offchain-certificate.module.js',
);
const typeorm02Path = require.resolve('typeorm', {
  paths: [certPkgPath],
});
// eslint-disable-next-line @typescript-eslint/no-var-requires
const EntityManager02 = require(typeorm02Path).EntityManager;

@Global()
@Module({
  providers: [
    {
      provide: EntityManager,
      useFactory: (dataSource: DataSource) => dataSource.manager,
      inject: [DataSource],
    },
    // Provide the 0.2.x EntityManager class token so the library's
    // useExisting: EntityManager resolves correctly
    {
      provide: EntityManager02,
      useFactory: (dataSource: DataSource) => dataSource.manager,
      inject: [DataSource],
    },
    {
      provide: ENTITY_MANAGER,
      useFactory: (dataSource: DataSource) => dataSource.manager,
      inject: [DataSource],
    },
  ],
  exports: [EntityManager, EntityManager02, ENTITY_MANAGER],
})
export class EntityManagerCompatModule {}
