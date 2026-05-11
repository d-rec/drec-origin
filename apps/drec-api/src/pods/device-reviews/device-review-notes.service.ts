import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceReviewNote } from './device-review-note.entity';

@Injectable()
export class DeviceReviewNotesService {
  constructor(
    @InjectRepository(DeviceReviewNote)
    private readonly repo: Repository<DeviceReviewNote>,
  ) {}

  /** All notes for a device, newest-first. Filter to open only when
   *  the reviewer flips the "hide resolved" toggle. */
  async list(deviceId: number, openOnly = false): Promise<DeviceReviewNote[]> {
    const where: any = { deviceId };
    if (openOnly) where.status = 'open';
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async create(
    deviceId: number,
    fieldName: string | null,
    body: string,
    createdBy: string,
  ): Promise<DeviceReviewNote> {
    const note = this.repo.create({
      deviceId,
      fieldName: fieldName?.trim() || null,
      body: body.trim(),
      status: 'open',
      createdBy,
    });
    return this.repo.save(note);
  }

  async resolve(noteId: number, resolvedBy: string): Promise<DeviceReviewNote> {
    const note = await this.repo.findOne({ where: { id: noteId } });
    if (!note) throw new NotFoundException(`note ${noteId} not found`);
    note.status = 'resolved';
    note.resolvedBy = resolvedBy;
    note.resolvedAt = new Date();
    return this.repo.save(note);
  }

  async reopen(noteId: number): Promise<DeviceReviewNote> {
    const note = await this.repo.findOne({ where: { id: noteId } });
    if (!note) throw new NotFoundException(`note ${noteId} not found`);
    note.status = 'open';
    note.resolvedBy = null;
    note.resolvedAt = null;
    return this.repo.save(note);
  }

  async delete(noteId: number): Promise<void> {
    const res = await this.repo.delete(noteId);
    if (!res.affected) throw new NotFoundException(`note ${noteId} not found`);
  }
}
