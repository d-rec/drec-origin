import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Chat } from './chat.entity';
import { ChatConversation } from './chat-conversation.entity';
import { ChatWebhook } from './chat-webhook.entity';
import { ChatService } from './chat.service';
import { ChatWebhookService } from './chat-webhook.service';
import { ChatController } from './chat.controller';
import { ChatWebhookController } from './chat-webhook.controller';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, ChatConversation, ChatWebhook, User]),
    HttpModule,
    forwardRef(() => UserModule),
  ],
  controllers: [ChatController, ChatWebhookController],
  providers: [ChatService, ChatWebhookService],
  exports: [ChatService, ChatWebhookService],
})
export class ChatModule {}
