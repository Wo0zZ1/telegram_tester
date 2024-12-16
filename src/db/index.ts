import { PrismaClient } from '@prisma/client'
import { IFetchData, IFetchDataWithId } from '../data/types'
import { IRequiredUserProps, IUser } from '../User'

export class DB {
	static exists: boolean
	static instance: DB
	#prisma = new PrismaClient()

	constructor() {
		// Singleton pattern
		if (DB.exists) return DB.instance
		DB.exists = true
		DB.instance = this

		this.#connect()
	}

	async #connect() {
		await this.#prisma.$connect()
	}

	async #disconnect() {
		await this.#prisma.$disconnect()
	}

	async getUsersWithNames() {
		return (await this.#prisma.user.findMany({
			include: { name: true },
		})) as IFetchDataWithId[]
	}

	async getUsers() {
		return await this.#prisma.user.findMany({
			include: { name: false },
		})
	}

	async createUser(data: IRequiredUserProps) {
		return await this.#prisma.user.create({
			data: { ...data, name: { create: data.name } },
		})
	}
}
