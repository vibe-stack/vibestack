ALTER TABLE "game_chat_messages" ALTER COLUMN "chat_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "game_chats" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "game_chats" ALTER COLUMN "id" DROP DEFAULT;