import { relations } from "drizzle-orm/relations";
import { games, commits, commitFiles, fileVersions, files, gameChats, gameChatMessages } from "./schema";

export const commitsRelations = relations(commits, ({one, many}) => ({
	game: one(games, {
		fields: [commits.gameId],
		references: [games.id]
	}),
	commitFiles: many(commitFiles),
}));

export const gamesRelations = relations(games, ({many}) => ({
	commits: many(commits),
	files: many(files),
	gameChats: many(gameChats),
}));

export const commitFilesRelations = relations(commitFiles, ({one}) => ({
	commit: one(commits, {
		fields: [commitFiles.commitId],
		references: [commits.id]
	}),
	fileVersion: one(fileVersions, {
		fields: [commitFiles.fileVersionId],
		references: [fileVersions.id]
	}),
}));

export const fileVersionsRelations = relations(fileVersions, ({one, many}) => ({
	commitFiles: many(commitFiles),
	file: one(files, {
		fields: [fileVersions.fileId],
		references: [files.id]
	}),
}));

export const filesRelations = relations(files, ({one, many}) => ({
	fileVersions: many(fileVersions),
	game: one(games, {
		fields: [files.gameId],
		references: [games.id]
	}),
}));

export const gameChatsRelations = relations(gameChats, ({one, many}) => ({
	game: one(games, {
		fields: [gameChats.gameId],
		references: [games.id]
	}),
	gameChatMessages: many(gameChatMessages),
}));

export const gameChatMessagesRelations = relations(gameChatMessages, ({one}) => ({
	gameChat: one(gameChats, {
		fields: [gameChatMessages.chatId],
		references: [gameChats.id]
	}),
}));