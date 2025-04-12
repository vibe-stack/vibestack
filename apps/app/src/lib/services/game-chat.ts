import { Message } from "ai";
import { db } from "../db";
import { gameChats, gameChatMessages } from "../db/schema";
import { eq, desc, asc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// Define a message type without the id field, but with optional createdAt and metadata
type MessageInput = {
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: Date;
  metadata?: Record<string, unknown>;
};

/**
 * Game Chat Service
 * Handles CRUD operations for game chat threads and messages
 */
export class GameChatService {
  /**
   * Create a new chat thread for a game
   * @param gameId - The ID of the game
   * @param title - Optional title for the chat thread
   * @returns The ID of the created thread
   */
  static async createThread(gameId: string, title?: string): Promise<string> {
    const [newThread] = await db
      .insert(gameChats)
      .values({
        id: uuidv4(),
        gameId,
        title: title || "New Chat",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({ id: gameChats.id });

    return newThread.id;
  }

  /**
   * Delete a chat thread and all its messages
   * @param threadId - The ID of the thread to delete
   * @returns True if successfully deleted
   */
  static async deleteThread(threadId: string): Promise<boolean> {
    try {
      // Delete all messages in the thread first (cascading delete would work too, but doing this explicitly)
      await db.delete(gameChatMessages).where(eq(gameChatMessages.chatId, threadId));
      
      // Delete the thread
      await db.delete(gameChats).where(eq(gameChats.id, threadId));
      
      return true;
    } catch (error) {
      console.error("Failed to delete thread:", error);
      return false;
    }
  }

  /**
   * Get a chat thread with its messages in chronological order
   * @param threadId - The ID of the thread to retrieve
   * @returns The thread with its messages
   */
  static async getThread(threadId: string): Promise<{ 
    id: string; 
    gameId: string;
    title: string | null;
    messages: Message[];
  } | null> {
    try {
      // Get the thread
      const thread = await db
        .select()
        .from(gameChats)
        .where(eq(gameChats.id, threadId))
        .limit(1);

      if (!thread || thread.length === 0) {
        return null;
      }

      // Get all messages for the thread in chronological order
      const messagesData = await db
        .select()
        .from(gameChatMessages)
        .where(eq(gameChatMessages.chatId, threadId))
        .orderBy(asc(gameChatMessages.createdAt));

      // Convert to AI SDK Message format
      const messages: Message[] = messagesData.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant" | "system",
        content: msg.content,
        createdAt: msg.createdAt,
        ...(msg.metadata ? { metadata: msg.metadata } : {}),
      }));

      return {
        id: thread[0].id,
        gameId: thread[0].gameId,
        title: thread[0].title,
        messages,
      };
    } catch (error) {
      console.error("Failed to get thread:", error);
      return null;
    }
  }

  /**
   * Get all chat threads for a game
   * @param gameId - The ID of the game
   * @returns Array of threads with their latest message
   */
  static async getThreadsByGameId(gameId: string): Promise<{
    id: string;
    title: string | null;
    createdAt: Date;
    updatedAt: Date;
  }[]> {
    try {
      const threads = await db
        .select()
        .from(gameChats)
        .where(eq(gameChats.gameId, gameId))
        .orderBy(desc(gameChats.updatedAt));

      return threads;
    } catch (error) {
      console.error("Failed to get threads for game:", error);
      return [];
    }
  }

  /**
   * Append a message to a chat thread
   * @param threadId - The ID of the thread
   * @param message - The message to append
   * @returns The ID of the created message
   */
  static async appendMessage(threadId: string, message: MessageInput): Promise<string | null> {
    try {
      // Update the thread's updatedAt timestamp
      await db
        .update(gameChats)
        .set({ updatedAt: new Date() })
        .where(eq(gameChats.id, threadId));

      // Insert the new message
      const messageId = uuidv4();
      const [newMessage] = await db
        .insert(gameChatMessages)
        .values({
          id: messageId,
          chatId: threadId,
          role: message.role,
          content: message.content,
          createdAt: message.createdAt || new Date(),
          metadata: message.metadata || null,
        })
        .returning({ id: gameChatMessages.id });

      return newMessage.id;
    } catch (error) {
      console.error("Failed to append message:", error);
      return null;
    }
  }

  /**
   * Override all messages in a thread with new ones
   * @param threadId - The ID of the thread
   * @param messages - The new messages to set
   * @returns True if successfully updated
   */
  static async overrideMessages(threadId: string, messages: MessageInput[]): Promise<boolean> {
    try {
      // Begin transaction
      return await db.transaction(async (tx) => {
        // Update the thread's updatedAt timestamp
        await tx
          .update(gameChats)
          .set({ updatedAt: new Date() })
          .where(eq(gameChats.id, threadId));

        // Delete all existing messages
        await tx
          .delete(gameChatMessages)
          .where(eq(gameChatMessages.chatId, threadId));

        // Skip if there are no new messages to insert
        if (messages.length === 0) return true;

        // Insert all new messages
        await tx
          .insert(gameChatMessages)
          .values(
            messages.map((message) => ({
              id: uuidv4(),
              chatId: threadId,
              role: message.role,
              content: message.content,
              createdAt: message.createdAt || new Date(),
              metadata: message.metadata || null,
            }))
          );

        return true;
      });
    } catch (error) {
      console.error("Failed to override messages:", error);
      return false;
    }
  }

  static async updateThreadTitle(threadId: string, title: string): Promise<boolean> {
    try {
      await db.update(gameChats).set({ title }).where(eq(gameChats.id, threadId));
      return true;
    } catch (error) {
      console.error("Failed to update thread title:", error);
      return false;
    }
  }
}

export type { Message, MessageInput };