import { Global, Module } from '@nestjs/common';
import { DataSource } from 'typeorm';

/**
 * Compatibility shim: @energyweb/origin-247-certificate@4.1.5 expects
 * an ENTITY_MANAGER provider (Symbol.for('ENTITY_MANAGER')) backed by
 * typeorm 0.2's EntityManager class. In typeorm 0.3 EntityManager is
 * no longer auto-registered as a NestJS provider.
 *
 * This global module provides ENTITY_MANAGER using the DataSource's
 * manager, making it available to OffChainCertificateModule without
 * patching the library.
 */
const ENTITY_MANAGER = Symbol.for('ENTITY_MANAGER');

@Global()
@Module({
  providers: [
    {
      provide: ENTITY_MANAGER,
      useFactory: (dataSource: DataSource) => dataSource.manager,
      inject: [DataSource],
    },
  ],
  exports: [ENTITY_MANAGER],
})
export class EntityManagerCompatModule {}
