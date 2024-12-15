import type { chatId, userName } from './types/index'
import { User } from './User'

interface IUserManager {
	users: { [chatId: string]: User }
	createUser(chatId: chatId, name: userName | undefined): User
	getUser(chatId: chatId): User | undefined
	deleteUser(chatId: chatId): User
}

export class UserManager implements IUserManager {
	users: { [chatId: string]: User }

	constructor() {
		// Хранилище состояний пользователей
		this.users = {}
	}

	createUser(chatId: chatId, name?: userName) {
		const currentUser = this.getUser(chatId)
		if (currentUser !== undefined) return currentUser
		return (this.users[chatId] = new User(chatId, name))
	}

	getUser(chatId: chatId) {
		if (!this.users[chatId]) return undefined
		return this.users[chatId]
	}

	deleteUser(chatId: chatId) {
		const deletedUser = this.users[chatId]
		delete this.users[chatId]
		return deletedUser
	}
}
