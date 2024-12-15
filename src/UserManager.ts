import type { userId, userName } from './types/index'
import { User } from './User'

interface IUserManager {
	users: { [userId: string]: User }
	createUser(userId: userId, name: userName | undefined): User
	getUser(userId: userId): User | undefined
	deleteUser(userId: userId): User
}

export class UserManager implements IUserManager {
	users: { [userId: string]: User }

	constructor() {
		// Хранилище состояний пользователей
		this.users = {}
	}

	createUser(userId: userId, name?: userName) {
		const currentUser = this.getUser(userId)
		if (currentUser !== undefined) return currentUser
		return (this.users[userId] = new User(userId, name))
	}

	getUser(userId: userId) {
		if (!this.users[userId]) return undefined
		return this.users[userId]
	}

	deleteUser(userId: userId) {
		const deletedUser = this.users[userId]
		delete this.users[userId]
		return deletedUser
	}
}
