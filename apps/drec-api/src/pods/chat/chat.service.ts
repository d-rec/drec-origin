import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './chat.entity';
import { ChatConversation } from './chat-conversation.entity';
import { User } from '../user/user.entity';
import { typedLog } from '../../logger';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(ChatConversation)
    private readonly conversationRepository: Repository<ChatConversation>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async appendMessage(
    username: string,
    chatEntry: string,
    previousEntryUuid?: string,
  ): Promise<Chat> {
    const node = this.chatRepository.create({
      username,
      chatEntry,
      nextEntryUuid: null,
    });
    const saved = await this.chatRepository.save(node);

    typedLog(
      this.logger,
      'chat',
      `Chat message sent by ${username}: ${chatEntry}`,
    );

    if (previousEntryUuid) {
      await this.chatRepository.update(previousEntryUuid, {
        nextEntryUuid: saved.uuid,
      });
    }

    return saved;
  }

  async getNode(uuid: string): Promise<Chat> {
    const node = await this.chatRepository.findOne({ where: { uuid } });
    if (!node) {
      throw new NotFoundException(`Chat node ${uuid} not found`);
    }
    return node;
  }

  async traverseChain(headUuid: string): Promise<Chat[]> {
    const nodes: Chat[] = [];
    let currentUuid: string | null = headUuid;

    while (currentUuid) {
      const node = await this.chatRepository.findOne({
        where: { uuid: currentUuid },
      });
      if (!node) break;
      nodes.push(node);
      currentUuid = node.nextEntryUuid;
    }

    return nodes;
  }

  async getConversation(
    participant1?: string,
    participant2?: string,
    deviceProjectName?: string,
  ): Promise<ChatConversation | null> {
    const qb = this.conversationRepository.createQueryBuilder('conv');
    if (deviceProjectName) {
      qb.where('conv.deviceProjectName = :dpn', { dpn: deviceProjectName });
    }
    if (participant1 && participant2) {
      const method = deviceProjectName ? 'andWhere' : 'where';
      qb[method](
        '(conv.participant1 = :p1 AND conv.participant2 = :p2) OR (conv.participant1 = :p2 AND conv.participant2 = :p1)',
        { p1: participant1, p2: participant2 },
      );
    }
    return qb.getOne();
  }

  async startConversation(
    participant1: string,
    participant2: string,
    firstMessageUsername: string,
    firstMessageEntry: string,
    deviceProjectName?: string,
  ): Promise<{ conversation: ChatConversation; message: Chat }> {
    const message = await this.appendMessage(
      firstMessageUsername,
      firstMessageEntry,
    );
    const conversation = this.conversationRepository.create({
      participant1,
      participant2,
      headUuid: message.uuid,
      lastEntryUuid: message.uuid,
      deviceProjectName: deviceProjectName ?? null,
    });
    const savedConversation =
      await this.conversationRepository.save(conversation);
    typedLog(
      this.logger,
      'chat',
      `Conversation started between ${participant1} and ${participant2}${deviceProjectName ? ` on device "${deviceProjectName}"` : ''}`,
    );
    return { conversation: savedConversation, message };
  }

  async appendToConversation(
    conversationId: number,
    username: string,
    chatEntry: string,
  ): Promise<Chat> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    const message = await this.appendMessage(
      username,
      chatEntry,
      conversation.lastEntryUuid ?? undefined,
    );

    await this.conversationRepository.update(conversationId, {
      lastEntryUuid: message.uuid,
    });

    typedLog(
      this.logger,
      'chat',
      `Message appended to conversation ${conversationId} by ${username}`,
    );
    return message;
  }

  async getAdminUser(): Promise<User | null> {
    return this.userRepository.findOne({ where: { roleId: 1 } });
  }

  async getAllConversations(): Promise<ChatConversation[]> {
    return this.conversationRepository.find();
  }

  async getConversationsForUser(email: string): Promise<ChatConversation[]> {
    return this.conversationRepository
      .createQueryBuilder('conv')
      .where('conv.participant1 = :email OR conv.participant2 = :email', {
        email,
      })
      .orderBy('conv.id', 'DESC')
      .getMany();
  }

  async clearConversation(conversationId: number): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    // Collect all chat node UUIDs in this conversation's chain
    const uuids: string[] = [];
    let currentUuid: string | null = conversation.headUuid;
    while (currentUuid) {
      const node = await this.chatRepository.findOne({
        where: { uuid: currentUuid },
      });
      if (!node) break;
      uuids.push(node.uuid);
      currentUuid = node.nextEntryUuid;
    }

    // Delete all chat nodes
    if (uuids.length) {
      await this.chatRepository.delete(uuids);
    }

    // Delete the conversation
    await this.conversationRepository.delete(conversationId);
    typedLog(
      this.logger,
      'chat',
      `Conversation ${conversationId} cleared (${uuids.length} messages deleted)`,
    );
  }

  async getUnreadCount(email: string): Promise<number> {
    // Count conversations where the user has unread messages
    // (a message exists after their lastReadAt)
    const rows = await this.conversationRepository
      .createQueryBuilder('conv')
      .innerJoin(
        Chat,
        'latest',
        'latest.uuid = conv."lastEntryUuid"',
      )
      .where(
        '(conv.participant1 = :email AND latest."createdAt" > COALESCE(conv."lastReadAt1", \'1970-01-01\')) OR ' +
        '(conv.participant2 = :email AND latest."createdAt" > COALESCE(conv."lastReadAt2", \'1970-01-01\'))',
        { email },
      )
      // Exclude conversations where the latest message is from the user themselves
      .andWhere('latest.username != :email', { email })
      .getCount();

    return rows;
  }

  async markConversationRead(
    conversationId: number,
    email: string,
  ): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
    });
    if (!conversation) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }

    const now = new Date();
    if (conversation.participant1 === email) {
      await this.conversationRepository.update(conversationId, {
        lastReadAt1: now,
      });
    } else if (conversation.participant2 === email) {
      await this.conversationRepository.update(conversationId, {
        lastReadAt2: now,
      });
    }
  }

  async getUnreadDeviceNames(email: string): Promise<string[]> {
    const rows = await this.conversationRepository
      .createQueryBuilder('conv')
      .innerJoin(
        Chat,
        'latest',
        'latest.uuid = conv."lastEntryUuid"',
      )
      .select('conv."deviceProjectName"', 'deviceProjectName')
      .where('conv."deviceProjectName" IS NOT NULL')
      .andWhere(
        '(conv.participant1 = :email AND latest."createdAt" > COALESCE(conv."lastReadAt1", \'1970-01-01\')) OR ' +
        '(conv.participant2 = :email AND latest."createdAt" > COALESCE(conv."lastReadAt2", \'1970-01-01\'))',
        { email },
      )
      .andWhere('latest.username != :email', { email })
      .getRawMany();

    return rows.map((r) => r.deviceProjectName);
  }

  async getConversationPartners(): Promise<string[]> {
    const conversations = await this.conversationRepository.find();
    const adminUser = await this.getAdminUser();
    if (!adminUser) return [];

    const adminEmail = adminUser.email;
    const partners = new Set<string>();

    for (const conv of conversations) {
      if (conv.participant1 === adminEmail) {
        partners.add(conv.participant2);
      } else if (conv.participant2 === adminEmail) {
        partners.add(conv.participant1);
      }
    }

    return Array.from(partners);
  }
}
