import TelegramBot from 'node-telegram-bot-api'
import { User } from './User.ts'
import type { chatId } from './types/index.ts'

interface IUserManager {
	bot: TelegramBot
	users: { [chatId: string]: User }
	createUser(chatId: chatId, name: string): void
	getUser(chatId: chatId): User | null
	deleteUser(chatId: chatId): User
}

export class UserManager implements IUserManager {
	users: { [chatId: string]: User }
	bot: TelegramBot

	constructor(bot: TelegramBot) {
		this.bot = bot
		this.users = {} // Хранилище состояний пользователей
	}

	createUser(chatId: chatId, name: string) {
		if (this.getUser(chatId) instanceof User) this.deleteUser(chatId)
		return (this.users[chatId] = new User(this.bot, chatId, name))
	}

	getUser(chatId: chatId) {
		if (!this.users[chatId]) return null
		return this.users[chatId]
	}

	deleteUser(chatId: chatId) {
		const deletedUser = this.users[chatId]
		delete this.users[chatId]
		return deletedUser
	}
}
