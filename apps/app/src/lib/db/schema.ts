import { pgTable, text, timestamp, uuid, json, integer } from "drizzle-orm/pg-core";

// Games table - stores information about each game project
export const games = pgTable("games", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Files table - stores the files associated with each game
export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),
  gameId: uuid("game_id").references(() => games.id, { onDelete: "cascade" }).notNull(),
  path: text("path").notNull(), // Virtual file path in the game project
  type: text("type").notNull(), // File type (js, html, css, asset, etc.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// File versions table - stores all versions of each file (git-like history)
export const fileVersions = pgTable("file_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  fileId: uuid("file_id").references(() => files.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  version: integer("version").notNull(),
  commitMessage: text("commit_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by"), // Could be "user" or "llm"
  metadata: json("metadata"), // For any additional metadata
});

// Commits table - groups file versions into a single commit (git-like)
export const commits = pgTable("commits", {
  id: uuid("id").defaultRandom().primaryKey(),
  gameId: uuid("game_id").references(() => games.id, { onDelete: "cascade" }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by"),
});

// CommitFiles table - many-to-many relationship between commits and file versions
export const commitFiles = pgTable("commit_files", {
  id: uuid("id").defaultRandom().primaryKey(),
  commitId: uuid("commit_id").references(() => commits.id, { onDelete: "cascade" }).notNull(),
  fileVersionId: uuid("file_version_id").references(() => fileVersions.id, { onDelete: "cascade" }).notNull(),
}); 