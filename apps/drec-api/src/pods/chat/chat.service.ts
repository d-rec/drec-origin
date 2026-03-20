import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './chat.entity';
import { ChatConversation } from './chat-conversation.entity';
import { User } from '../user/user.entity';

@Injectable()
export class ChatService {
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
    participant1: string,
    participant2: string,
  ): Promise<ChatConversation | null> {
    return this.conversationRepository
      .createQueryBuilder('conv')
      .where(
        '(conv.participant1 = :p1 AND conv.participant2 = :p2) OR (conv.participant1 = :p2 AND conv.participant2 = :p1)',
        { p1: participant1, p2: participant2 },
      )
      .getOne();
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
    const savedConversation = await this.conversationRepository.save(conversation);
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

    return message;
  }

  async getAdminUser(): Promise<User | null> {
    return this.userRepository.findOne({ where: { roleId: 1 } });
  }

  async getAllConversations(): Promise<ChatConversation[]> {
    return this.conversationRepository.find();
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
