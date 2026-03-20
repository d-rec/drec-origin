import {
  Body,
  Controller,
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
import { AuthVerifiedGuard, PermissionGuard } from '../../guards';
import { Permission } from '../permission/decorators/permission.decorator';
import { ACLModules } from '../access-control-layer-module-service/decorator/aclModule.decorator';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatDto, ConversationDto } from './dto/chat.dto';
import { Chat } from './chat.entity';
import { ChatConversation } from './chat-conversation.entity';

@ApiTags('Chat')
@ApiBearerAuth('access-token')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('messages')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('CHAT_MANAGEMENT_CRUDL')
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
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('CHAT_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'Append a message to a conversation (updates lastEntryUuid)' })
  @ApiResponse({ status: 201, type: ChatDto })
  async appendToConversation(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { username: string; chatEntry: string },
  ): Promise<Chat> {
    return this.chatService.appendToConversation(id, body.username, body.chatEntry);
  }

  @Get('chain/:headUuid')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('CHAT_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'Traverse linked list from head UUID' })
  @ApiResponse({ status: 200, type: [ChatDto] })
  async traverseChain(@Param('headUuid') headUuid: string): Promise<Chat[]> {
    return this.chatService.traverseChain(headUuid);
  }

  @Get('node/:uuid')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('CHAT_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'Get a single chat node by UUID' })
  @ApiResponse({ status: 200, type: ChatDto })
  async getNode(@Param('uuid') uuid: string): Promise<Chat> {
    return this.chatService.getNode(uuid);
  }

  @Get('admin')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('CHAT_MANAGEMENT_CRUDL')
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
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('CHAT_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'List all conversations' })
  @ApiResponse({ status: 200, type: [ConversationDto] })
  async getAllConversations(): Promise<ChatConversation[]> {
    return this.chatService.getAllConversations();
  }

  @Post('conversations/find')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Read')
  @ACLModules('CHAT_MANAGEMENT_CRUDL')
  @ApiOperation({ summary: 'Find conversation between two participants' })
  @ApiResponse({ status: 200, type: ConversationDto })
  async getConversation(
    @Body() body: { participant1: string; participant2: string },
  ): Promise<ChatConversation | null> {
    return this.chatService.getConversation(body.participant1, body.participant2);
  }

  @Post('conversations/start')
  @UseGuards(AuthVerifiedGuard('jwt'), PermissionGuard)
  @Permission('Write')
  @ACLModules('CHAT_MANAGEMENT_CRUDL')
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
