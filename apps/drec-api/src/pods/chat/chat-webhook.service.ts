import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { ChatWebhook } from './chat-webhook.entity';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { typedLog } from '../../logger';

@Injectable()
export class ChatWebhookService {
  private readonly logger = new Logger(ChatWebhookService.name);

  constructor(
    @InjectRepository(ChatWebhook)
    private readonly webhookRepository: Repository<ChatWebhook>,
    private readonly httpService: HttpService,
  ) {}

  async create(
    userId: number,
    organizationId: number | null,
    dto: CreateWebhookDto,
  ): Promise<ChatWebhook> {
    const secret = dto.secret || crypto.randomBytes(32).toString('hex');

    const webhook = this.webhookRepository.create({
      userId,
      organizationId,
      url: dto.url,
      events: dto.events,
      secret,
      active: true,
    });

    const saved = await this.webhookRepository.save(webhook);
    typedLog(
      this.logger,
      'chat',
      `Webhook ${saved.id} created for user ${userId}`,
    );
    return saved;
  }

  async findAll(): Promise<ChatWebhook[]> {
    return this.webhookRepository.find();
  }

  async findByUser(userId: number): Promise<ChatWebhook[]> {
    return this.webhookRepository.find({ where: { userId } });
  }

  async findOne(id: number): Promise<ChatWebhook> {
    const webhook = await this.webhookRepository.findOne({ where: { id } });
    if (!webhook) {
      throw new NotFoundException(`Webhook ${id} not found`);
    }
    return webhook;
  }

  async update(id: number, dto: UpdateWebhookDto): Promise<ChatWebhook> {
    const webhook = await this.findOne(id);
    Object.assign(webhook, dto);
    return this.webhookRepository.save(webhook);
  }

  async remove(id: number): Promise<void> {
    const webhook = await this.findOne(id);
    await this.webhookRepository.remove(webhook);
    typedLog(this.logger, 'chat', `Webhook ${id} deleted`);
  }

  async dispatch(event: string, payload: Record<string, any>): Promise<void> {
    const webhooks = await this.webhookRepository.find({
      where: { active: true },
    });

    const matching = webhooks.filter(
      (wh) =>
        wh.events.length === 0 ||
        wh.events.includes('*') ||
        wh.events.includes(event),
    );

    for (const wh of matching) {
      this.deliverWithRetry(wh, event, payload).catch((err) => {
        typedLog(
          this.logger,
          'chat',
          `Webhook ${wh.id} delivery failed after retries: ${err.message}`,
        );
      });
    }
  }

  async ping(webhookId: number): Promise<void> {
    const webhook = await this.findOne(webhookId);
    const payload = { event: 'ping', timestamp: new Date().toISOString() };
    await this.deliverWithRetry(webhook, 'ping', payload);
  }

  private async deliverWithRetry(
    webhook: ChatWebhook,
    event: string,
    payload: Record<string, any>,
    maxAttempts = 3,
  ): Promise<void> {
    const body = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(body)
      .digest('hex');

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await firstValueFrom(
          this.httpService.post(webhook.url, body, {
            headers: {
              'Content-Type': 'application/json',
              'X-Webhook-Signature': signature,
              'X-Webhook-Event': event,
            },
            timeout: 10_000,
          }),
        );
        return;
      } catch (err) {
        if (attempt === maxAttempts) {
          throw err;
        }
        const delay = Math.pow(4, attempt - 1) * 1000; // 1s, 4s, 16s
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
}
