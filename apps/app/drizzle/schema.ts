import { pgTable, foreignKey, uuid, text, timestamp, integer, json } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const commits = pgTable("commits", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	gameId: uuid("game_id").notNull(),
	message: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
}, (table) => [
	foreignKey({
			columns: [table.gameId],
			foreignColumns: [games.id],
			name: "commits_game_id_games_id_fk"
		}).onDelete("cascade"),
]);

export const commitFiles = pgTable("commit_files", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	commitId: uuid("commit_id").notNull(),
	fileVersionId: uuid("file_version_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.commitId],
			foreignColumns: [commits.id],
			name: "commit_files_commit_id_commits_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.fileVersionId],
			foreignColumns: [fileVersions.id],
			name: "commit_files_file_version_id_file_versions_id_fk"
		}).onDelete("cascade"),
]);

export const fileVersions = pgTable("file_versions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	fileId: uuid("file_id").notNull(),
	content: text().notNull(),
	version: integer().notNull(),
	commitMessage: text("commit_message"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	createdBy: text("created_by"),
	metadata: json(),
}, (table) => [
	foreignKey({
			columns: [table.fileId],
			foreignColumns: [files.id],
			name: "file_versions_file_id_files_id_fk"
		}).onDelete("cascade"),
]);

export const games = pgTable("games", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
});

export const files = pgTable("files", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	gameId: uuid("game_id").notNull(),
	path: text().notNull(),
	type: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.gameId],
			foreignColumns: [games.id],
			name: "files_game_id_games_id_fk"
		}).onDelete("cascade"),
]);

export const gameChats = pgTable("game_chats", {
	id: text().primaryKey().notNull(),
	gameId: uuid("game_id").notNull(),
	title: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.gameId],
			foreignColumns: [games.id],
			name: "game_chats_game_id_games_id_fk"
		}).onDelete("cascade"),
]);

export const gameChatMessages = pgTable("game_chat_messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	chatId: text("chat_id").notNull(),
	role: text().notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	metadata: json(),
}, (table) => [
	foreignKey({
			columns: [table.chatId],
			foreignColumns: [gameChats.id],
			name: "game_chat_messages_chat_id_game_chats_id_fk"
		}).onDelete("cascade"),
]);
