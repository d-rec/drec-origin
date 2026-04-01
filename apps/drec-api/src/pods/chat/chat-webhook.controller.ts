import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthVerifiedGuard } from '../../guards';
import { ChatWebhookService } from './chat-webhook.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { ChatWebhook } from './chat-webhook.entity';

function maskSecret(secret: string): string {
  if (secret.length <= 4) return secret;
  return '****' + secret.slice(-4);
}

function sanitizeWebhook(webhook: ChatWebhook): any {
  return {
    ...webhook,
    secret: maskSecret(webhook.secret),
  };
}

@ApiTags('Chat Webhooks')
@ApiBearerAuth('access-token')
@Controller('chat/webhooks')
@UseGuards(AuthVerifiedGuard(['jwt', 'oauth2-client-password']))
export class ChatWebhookController {
  constructor(private readonly webhookService: ChatWebhookService) {}

  @Get()
  @ApiOperation({ summary: 'List webhooks (Admin sees all, others see own)' })
  @ApiResponse({ status: 200 })
  async findAll(@Req() request: Request): Promise<any[]> {
    const user = request.user as any;
    const webhooks =
      user.role === 'Admin'
        ? await this.webhookService.findAll()
        : await this.webhookService.findByUser(user.id);
    return webhooks.map(sanitizeWebhook);
  }

  @Post()
  @ApiOperation({ summary: 'Create a webhook' })
  @ApiResponse({ status: 201 })
  async create(
    @Req() request: Request,
    @Body() dto: CreateWebhookDto,
  ): Promise<ChatWebhook> {
    const user = request.user as any;
    const webhook = await this.webhookService.create(
      user.id,
      user.organizationId ?? null,
      dto,
    );
    // Return full secret on create only
    return webhook;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single webhook' })
  @ApiResponse({ status: 200 })
  async findOne(
    @Req() request: Request,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<any> {
    const user = request.user as any;
    const webhook = await this.webhookService.findOne(id);
    if (user.role !== 'Admin' && webhook.userId !== user.id) {
      throw new ForbiddenException();
    }
    return sanitizeWebhook(webhook);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a webhook' })
  @ApiResponse({ status: 200 })
  async update(
    @Req() request: Request,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWebhookDto,
  ): Promise<any> {
    const user = request.user as any;
    const webhook = await this.webhookService.findOne(id);
    if (user.role !== 'Admin' && webhook.userId !== user.id) {
      throw new ForbiddenException();
    }
    const updated = await this.webhookService.update(id, dto);
    return sanitizeWebhook(updated);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a webhook' })
  @ApiResponse({ status: 200 })
  async remove(
    @Req() request: Request,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean }> {
    const user = request.user as any;
    const webhook = await this.webhookService.findOne(id);
    if (user.role !== 'Admin' && webhook.userId !== user.id) {
      throw new ForbiddenException();
    }
    await this.webhookService.remove(id);
    return { success: true };
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Send a ping to the webhook' })
  @ApiResponse({ status: 200 })
  async ping(
    @Req() request: Request,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean }> {
    const user = request.user as any;
    const webhook = await this.webhookService.findOne(id);
    if (user.role !== 'Admin' && webhook.userId !== user.id) {
      throw new ForbiddenException();
    }
    await this.webhookService.ping(id);
    return { success: true };
  }
}
