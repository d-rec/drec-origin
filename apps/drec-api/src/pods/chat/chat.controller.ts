import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
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

@ApiTags('Chat')
@ApiBearerAuth('access-token')
@Controller('chat')
@UseGuards(AuthVerifiedGuard('jwt'))
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
    summary: 'Append a message to a conversation (updates lastEntryUuid)',
  })
  @ApiResponse({ status: 201, type: ChatDto })
  async appendToConversation(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { username: string; chatEntry: string },
  ): Promise<Chat> {
    return this.chatService.appendToConversation(
      id,
      body.username,
      body.chatEntry,
    );
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
      deviceProjectName?: string;
    },
  ): Promise<ChatConversation | null> {
    return this.chatService.getConversation(
      body.participant1,
      body.participant2,
      body.deviceProjectName,
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

  @Post('conversations/start')
  @ApiOperation({ summary: 'Start a new conversation with a first message' })
  async startConversation(
    @Body()
    body: {
      participant1: string;
      participant2: string;
      username: string;
      chatEntry: string;
      deviceProjectName?: string;
    },
  ): Promise<any> {
    return this.chatService.startConversation(
      body.participant1,
      body.participant2,
      body.username,
      body.chatEntry,
      body.deviceProjectName,
    );
  }
}
