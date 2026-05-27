import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('document_extractions')
@Index('document_extractions_doc_endpoint_uq', ['documentId', 'endpoint'], {
  unique: true,
})
export class DocumentExtractionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'document_id' })
  documentId: number;

  @Column({ name: 'endpoint' })
  endpoint: string;

  @Column({ name: 'response', type: 'jsonb' })
  response: Record<string, any>;

  @Column({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_at' })
  updatedAt: Date;
}
