import { IFetchData, IFetchDataWithId } from './data/types'
import { DB } from './db/index'
import type { userId, userName } from './types/index'
import { IRequiredUserProps, IUser, IUserProps, User } from './User'

interface IUserManager {
	users: { [userId: string]: User }
	createUser(userId: userId, name: userName | undefined): User
	getUser(userId: userId): User | undefined
	deleteUser(userId: userId): User
}

export class UserManager implements IUserManager {
	users: { [userId: string | string]: User }

	constructor(usersData: { [userId: string]: User } = {}) {
		// Хранилище состояний пользователей
		this.users = usersData
		if (Object.keys.length !== 0) return
		this.init()
	}

	async init(users?: User[]) {
		if (users)
			return users.forEach(user => {
				this.users[user.userId] = user
			})
		const db = new DB()
		const usersWithNames = (await db.getUsersWithNames()).map(
			user => {
				const currentUser: IFetchData = user
				delete currentUser.id
				delete currentUser.nameId
				delete currentUser.name.id
				return currentUser
			},
		)
		usersWithNames.map(user => {
			const currentUser = new User(user as IUserProps)
			this.users[user.userId] = currentUser
		})
	}

	createUser(userId: userId, name?: userName) {
		const currentUser = this.getUser(userId)
		if (currentUser !== undefined) return currentUser
		return (this.users[userId] = new User({ userId, name }))
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
