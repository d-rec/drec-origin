import { BaseEntity, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export class ExtendedBaseEntity extends BaseEntity {
  @CreateDateColumn({
    type: 'timestamptz',
    transformer: {
      from: (value?: Date) => value?.toISOString(),
      to: (value?: string) =>
        value === undefined || value === null ? value : new Date(value),
    },
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    transformer: {
      from: (value?: Date) => value?.toISOString(),
      to: (value?: string) =>
        value === undefined || value === null ? value : new Date(value),
    },
  })
  updatedAt: Date;
}
