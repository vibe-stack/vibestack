import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Games table - stores information about each game project
export const games = sqliteTable("games", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// Files table - stores the files associated with each game
export const files = sqliteTable("files", {
  id: text("id").primaryKey(),
  gameId: text("game_id").notNull(),
  path: text("path").notNull(), // Virtual file path in the game project
  type: text("type").notNull(), // File type (js, html, css, asset, etc.)
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// File versions table - stores all versions of each file (git-like history)
export const fileVersions = sqliteTable("file_versions", {
  id: text("id").primaryKey(),
  fileId: text("file_id").notNull(),
  content: text("content").notNull(),
  version: integer("version").notNull(),
  commitMessage: text("commit_message"),
  createdAt: integer("created_at").notNull(),
  createdBy: text("created_by"), // Could be "user" or "llm"
  metadata: text("metadata"), // For any additional metadata
});

// Commits table - groups file versions into a single commit (git-like)
export const commits = sqliteTable("commits", {
  id: text("id").primaryKey(),
  gameId: text("game_id").notNull(),
  message: text("message").notNull(),
  createdAt: integer("created_at").notNull(),
  createdBy: text("created_by"),
});

// CommitFiles table - many-to-many relationship between commits and file versions
export const commitFiles = sqliteTable("commit_files", {
  id: text("id").primaryKey(),
  commitId: text("commit_id").notNull(),
  fileVersionId: text("file_version_id").notNull(),
});

// Game chat threads table - stores chat threads for games
export const gameChats = sqliteTable("game_chats", {
  id: text("id").primaryKey(),
  gameId: text("game_id").notNull(),
  title: text("title"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

// Game chat messages table - stores messages in chat threads
export const gameChatMessages = sqliteTable("game_chat_messages", {
  id: text("id").primaryKey(),
  chatId: text("chat_id").notNull(),
  role: text("role").notNull(), // 'user', 'assistant', 'system', etc.
  content: text("content").notNull(),
  createdAt: integer("created_at").notNull(),
  metadata: text("metadata"), // For any additional metadata
});