import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthVerifiedGuard } from '../../guards';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatDto, ConversationDto } from './dto/chat.dto';
import { Chat } from './chat.entity';
import { ChatConversation } from './chat-conversation.entity';
import { UserDecorator } from '../user/decorators/user.decorator';
import { ILoggedInUser } from '../../models';

@ApiTags('Chat')
@ApiBearerAuth('access-token')
@Controller('chat')
@UseGuards(AuthVerifiedGuard(['jwt', 'oauth2-client-password']))
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  @ApiOperation({ summary: 'Append a chat message node (standalone)' })
  @ApiResponse({ status: 201, type: ChatDto })
  async appendMessage(@Body() dto: SendMessageDto): Promise<Chat> {
    return this.chatService.appendMessage(
      dto.username,
      dto.chatEntry,
      dto.previousEntryUuid,
    );
  }

  @Post('conversations/:id/messages')
  @ApiOperation({
    summary:
      'Append a message to a conversation (updates lastEntryUuid). ' +
      'kind defaults to "text"; pass "note" with fieldName for an ' +
      'anchored reviewer note.',
  })
  @ApiResponse({ status: 201, type: ChatDto })
  async appendToConversation(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      username: string;
      chatEntry: string;
      kind?: 'text' | 'note' | 'system' | 'doc-ref';
      fieldName?: string | null;
      payload?: Record<string, any> | null;
    },
  ): Promise<Chat> {
    return this.chatService.appendToConversation(
      id,
      body.username,
      body.chatEntry,
      { kind: body.kind, fieldName: body.fieldName, payload: body.payload },
    );
  }

  @Patch('messages/:uuid/resolve')
  @ApiOperation({
    summary:
      'Resolve a reviewer note. Only reviewers/admins should call this; ' +
      'appends a kind="system" audit marker to the chain.',
  })
  async resolveNote(
    @Param('uuid') uuid: string,
    @UserDecorator() user: ILoggedInUser,
  ): Promise<Chat> {
    return this.chatService.resolveNote(uuid, user.email);
  }

  @Patch('messages/:uuid/reopen')
  @ApiOperation({ summary: 'Re-open a previously resolved reviewer note' })
  async reopenNote(
    @Param('uuid') uuid: string,
    @UserDecorator() user: ILoggedInUser,
  ): Promise<Chat> {
    return this.chatService.reopenNote(uuid, user.email);
  }

  @Get('chain/:headUuid')
  @ApiOperation({ summary: 'Traverse linked list from head UUID' })
  @ApiResponse({ status: 200, type: [ChatDto] })
  async traverseChain(@Param('headUuid') headUuid: string): Promise<Chat[]> {
    return this.chatService.traverseChain(headUuid);
  }

  @Get('node/:uuid')
  @ApiOperation({ summary: 'Get a single chat node by UUID' })
  @ApiResponse({ status: 200, type: ChatDto })
  async getNode(@Param('uuid') uuid: string): Promise<Chat> {
    return this.chatService.getNode(uuid);
  }

  @Get('admin')
  @ApiOperation({ summary: 'Get the admin user info' })
  async getAdminUser(): Promise<any> {
    const admin = await this.chatService.getAdminUser();
    if (!admin) return null;
    return {
      id: admin.id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
    };
  }

  @Get('conversations')
  @ApiOperation({ summary: 'List all conversations' })
  @ApiResponse({ status: 200, type: [ConversationDto] })
  async getAllConversations(): Promise<ChatConversation[]> {
    return this.chatService.getAllConversations();
  }

  @Get('conversations/admin/all')
  @ApiOperation({
    summary:
      'Admin/SeniorReviewer chat-review list — every conversation, with each row enriched with the latest message preview and timestamp',
  })
  @ApiResponse({ status: 200 })
  async getAllConversationsEnriched(): Promise<unknown[]> {
    return this.chatService.getAllConversationsEnriched();
  }

  @Get('conversations/user/:email')
  @ApiOperation({ summary: 'Get all conversations for a user by email' })
  @ApiResponse({ status: 200, type: [ConversationDto] })
  async getConversationsForUser(
    @Param('email') email: string,
  ): Promise<ChatConversation[]> {
    return this.chatService.getConversationsForUser(email);
  }

  @Post('conversations/find')
  @ApiOperation({ summary: 'Find conversation between two participants' })
  @ApiResponse({ status: 200, type: ConversationDto })
  async getConversation(
    @Body()
    body: {
      participant1: string;
      participant2: string;
      deviceSiteName?: string;
    },
  ): Promise<ChatConversation | null> {
    return this.chatService.getConversation(
      body.participant1,
      body.participant2,
      body.deviceSiteName,
    );
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Clear/delete a conversation and all its messages' })
  async clearConversation(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean }> {
    await this.chatService.clearConversation(id);
    return { success: true };
  }

  @Delete('messages/:uuid')
  @ApiOperation({
    summary:
      'Delete a single chat message — splices the linked list so the conversation chain stays continuous. Reinstated 2026-05-15 at user request; if audit-trail concerns return, gate this on role.',
  })
  async deleteMessage(
    @Param('uuid') uuid: string,
    @UserDecorator() user: ILoggedInUser,
  ): Promise<{ conversationId: number | null; headUuid: string | null }> {
    return this.chatService.deleteMessage(
      uuid,
      user.email?.split('@')[0] ?? 'user',
      user.email,
    );
  }

  @Get('unread-count/:email')
  @ApiOperation({ summary: 'Get unread conversation count for a user' })
  async getUnreadCount(
    @Param('email') email: string,
  ): Promise<{ count: number }> {
    const count = await this.chatService.getUnreadCount(email);
    return { count };
  }

  @Get('unread-devices/:email')
  @ApiOperation({ summary: 'Get device site names with unread messages' })
  async getUnreadDeviceNames(@Param('email') email: string): Promise<string[]> {
    return this.chatService.getUnreadDeviceNames(email);
  }

  @Patch('conversations/:id/read')
  @ApiOperation({ summary: 'Mark a conversation as read for a user' })
  async markConversationRead(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { email: string },
  ): Promise<{ success: boolean }> {
    await this.chatService.markConversationRead(id, body.email);
    return { success: true };
  }

  @Post('conversations/start')
  @ApiOperation({ summary: 'Start a new conversation with a first message' })
  async startConversation(
    @Body()
    body: {
      participant1: string;
      participant2: string;
      username: string;
      chatEntry: string;
      deviceSiteName?: string;
    },
  ): Promise<any> {
    return this.chatService.startConversation(
      body.participant1,
      body.participant2,
      body.username,
      body.chatEntry,
      body.deviceSiteName,
    );
  }
}
