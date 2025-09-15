import { EntityManager } from 'typeorm';

export const ENTITY_MANAGER = Symbol.for('ENTITY_MANAGER');

export const InMemoryEntityManager: EntityManager = {
    async transaction<T>(cb: (manager: null) => Promise<T>): Promise<T> {
        return await cb(null);
    }
} as any;