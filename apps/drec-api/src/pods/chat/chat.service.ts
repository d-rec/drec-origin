import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chat } from './chat.entity';
import { ChatConversation } from './chat-conversation.entity';
import { User } from '../user/user.entity';
import { typedLog } from '../../logger';
import { ChatWebhookService } from './chat-webhook.service';

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
    private readonly webhookService: ChatWebhookService,
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

  /** Delete a single chat message and rewire the linked-list so the chain
   *  stays continuous. Any participant can delete any message. */
  async deleteMessage(
    uuid: string,
    _requesterUsername: string,
    _requesterEmail?: string,
  ): Promise<void> {
    const node = await this.chatRepository.findOne({ where: { uuid } });
    if (!node) throw new NotFoundException(`Chat node ${uuid} not found`);

    // Rewire prev → next so the chain stays continuous.
    const prev = await this.chatRepository.findOne({
      where: { nextEntryUuid: uuid },
    });
    if (prev) {
      prev.nextEntryUuid = node.nextEntryUuid;
      await this.chatRepository.save(prev);
    }
    // If this was the head of a conversation, advance head pointer.
    // If there's no next node, drop the whole conversation row to satisfy
    // the NOT NULL constraint on headUuid.
    const conv = await this.conversationRepository.findOne({
      where: { headUuid: uuid },
    });
    if (conv) {
      if (node.nextEntryUuid) {
        conv.headUuid = node.nextEntryUuid;
        await this.conversationRepository.save(conv);
      } else {
        await this.conversationRepository.delete(conv.id);
      }
    }
    await this.chatRepository.delete(uuid);
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
    deviceSiteName?: string,
  ): Promise<ChatConversation | null> {
    const qb = this.conversationRepository.createQueryBuilder('conv');
    if (deviceSiteName) {
      qb.where('conv.deviceSiteName = :dpn', { dpn: deviceSiteName });
    }
    if (participant1 && participant2) {
      const method = deviceSiteName ? 'andWhere' : 'where';
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
    deviceSiteName?: string,
  ): Promise<{ conversation: ChatConversation; message: Chat }> {
    // If a conversation already exists between these participants (for this
    // device), append the message to it instead of creating a duplicate conversation.
    const existing = await this.getConversation(
      participant1,
      participant2,
      deviceSiteName,
    );
    if (existing) {
      const message = await this.appendToConversation(
        existing.id,
        firstMessageUsername,
        firstMessageEntry,
      );
      return { conversation: existing, message };
    }

    const message = await this.appendMessage(
      firstMessageUsername,
      firstMessageEntry,
    );
    // Pre-mark the sender's side as read so they don't see their own
    // first message as unread.
    const senderLocal = (firstMessageUsername || '').toLowerCase().split('@')[0];
    const p1 = (participant1 || '').toLowerCase();
    const p2 = (participant2 || '').toLowerCase();
    const isSender = (email: string): boolean =>
      email === firstMessageUsername.toLowerCase() ||
      email.split('@')[0] === senderLocal;
    const conversation = this.conversationRepository.create({
      participant1,
      participant2,
      headUuid: message.uuid,
      lastEntryUuid: message.uuid,
      deviceSiteName: deviceSiteName ?? null,
      lastReadAt1: isSender(p1) ? new Date() : null,
      lastReadAt2: isSender(p2) ? new Date() : null,
    });
    const savedConversation =
      await this.conversationRepository.save(conversation);
    typedLog(
      this.logger,
      'chat',
      `Conversation started between ${participant1} and ${participant2}${deviceSiteName ? ` on device "${deviceSiteName}"` : ''}`,
    );

    // Fire-and-forget webhook dispatch
    this.webhookService.dispatch('conversation.created', {
      conversation: {
        id: savedConversation.id,
        participant1: savedConversation.participant1,
        participant2: savedConversation.participant2,
        deviceSiteName: savedConversation.deviceSiteName,
      },
      message: {
        uuid: message.uuid,
        username: firstMessageUsername,
        chatEntry: firstMessageEntry,
      },
    });

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

    // Dedup: if the last message in this conversation is from the same user
    // with identical text and was created within the last 60 seconds, return
    // the existing message instead of creating a duplicate.
    if (conversation.lastEntryUuid) {
      const lastMsg = await this.chatRepository.findOne({
        where: { uuid: conversation.lastEntryUuid },
      });
      if (
        lastMsg &&
        lastMsg.username === username &&
        lastMsg.chatEntry === chatEntry &&
        Date.now() - lastMsg.createdAt.getTime() < 60_000
      ) {
        typedLog(
          this.logger,
          'chat',
          `Duplicate message suppressed in conversation ${conversationId} by ${username}`,
        );
        return lastMsg;
      }
    }

    const message = await this.appendMessage(
      username,
      chatEntry,
      conversation.lastEntryUuid ?? undefined,
    );

    // Mark the sender's side of the conversation as read so the author
    // doesn't see a "new message" badge for their own message.
    const senderLocal = (username || '').toLowerCase().split('@')[0];
    const p1 = (conversation.participant1 || '').toLowerCase();
    const p2 = (conversation.participant2 || '').toLowerCase();
    const update: Partial<typeof conversation> = {
      lastEntryUuid: message.uuid,
    };
    const matchSlot = (email: string): boolean =>
      email === username.toLowerCase() ||
      email.split('@')[0] === senderLocal;
    if (matchSlot(p1)) update.lastReadAt1 = new Date();
    if (matchSlot(p2)) update.lastReadAt2 = new Date();
    await this.conversationRepository.update(conversationId, update);

    typedLog(
      this.logger,
      'chat',
      `Message appended to conversation ${conversationId} by ${username}`,
    );

    // Fire-and-forget webhook dispatch
    this.webhookService.dispatch('message.new', {
      conversationId,
      message: {
        uuid: message.uuid,
        username,
        chatEntry,
        createdAt: message.createdAt,
      },
      deviceSiteName: conversation.deviceSiteName,
    });

    return message;
  }

  async getAdminUser(): Promise<User | null> {
    return this.userRepository.findOne({ where: { roleId: 1 } });
  }

  async getAllConversations(): Promise<ChatConversation[]> {
    return this.conversationRepository.find();
  }

  /**
   * Enriched conversation list for the admin chat-review panel:
   * each row carries the latest message's text snippet + timestamp +
   * author so the list pane can render last-activity sort order without
   * an N+1 round-trip.
   */
  async getAllConversationsEnriched(): Promise<
    Array<
      ChatConversation & {
        lastMessageAt: Date | null;
        lastMessageBy: string | null;
        lastMessagePreview: string | null;
      }
    >
  > {
    const rows = await this.conversationRepository
      .createQueryBuilder('conv')
      .leftJoin(Chat, 'last', 'last.uuid = conv."lastEntryUuid"')
      .addSelect('last."createdAt"', 'lastMessageAt')
      .addSelect('last.username', 'lastMessageBy')
      .addSelect('LEFT(last."chatEntry", 160)', 'lastMessagePreview')
      .orderBy('last."createdAt"', 'DESC', 'NULLS LAST')
      .getRawAndEntities();

    return rows.entities.map((conv, i) => ({
      ...conv,
      lastMessageAt: rows.raw[i].lastMessageAt ?? null,
      lastMessageBy: rows.raw[i].lastMessageBy ?? null,
      lastMessagePreview: rows.raw[i].lastMessagePreview ?? null,
    }));
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
      .select('conv."deviceSiteName"', 'deviceSiteName')
      .where('conv."deviceSiteName" IS NOT NULL')
      .andWhere(
        '(conv.participant1 = :email AND latest."createdAt" > COALESCE(conv."lastReadAt1", \'1970-01-01\')) OR ' +
        '(conv.participant2 = :email AND latest."createdAt" > COALESCE(conv."lastReadAt2", \'1970-01-01\'))',
        { email },
      )
      .andWhere('latest.username != :email', { email })
      .getRawMany();

    return rows.map((r) => r.deviceSiteName);
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
