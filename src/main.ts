import type {
	SendMessageOptions,
	TelegramEvents,
} from 'node-telegram-bot-api'
import { UserManager } from './UserManager'
import { config } from 'dotenv'
import {
	ICallback,
	ICallbackAnswer,
	ICallbackResult,
	IMessageHandler,
	userName,
} from './types'
import { bot } from './bot'
import { DB } from './db'
import { IUser, IUserProps, User } from './User'
import { IFetchData } from './data/types'
import { User2Data } from './dto/User2Data'

config()

const adminuserId = process.env.ADMIN_CHAT_ID!
// console.log(adminuserId) // Admin ID

export interface IApp {
	userManager: UserManager
	_registerEventListeners(messageHandlers: IMessageHandler[]): void
	registerOnEvent(
		type: keyof TelegramEvents,
		handler: IMessageHandler,
	): void
	sendMessageToOwner(message: string): void
}

export class App implements IApp {
	static exists: boolean
	static instance: App
	userManager = new UserManager()

	constructor(messageHandlers: IMessageHandler[]) {
		// Singleton pattern
		if (App.exists) return App.instance
		App.exists = true
		App.instance = this

		this.#init()
		this._registerEventListeners(messageHandlers)
	}

	async #init() {
		const db = new DB()
		const usersWithNames = (await db.getUsersWithNames()).map(
			user => {
				const currentUserProps: IFetchData = user
				delete currentUserProps.id
				delete currentUserProps.nameId
				delete currentUserProps.name.id
				return new User(currentUserProps)
			},
		)
		return this.userManager.init(usersWithNames)
	}

	_registerEventListeners(messageHandlers: IMessageHandler[]) {
		messageHandlers.forEach(handler =>
			this.registerOnEvent('message', handler),
		)

		bot.setMyCommands([
			{ command: 'start', description: 'Начать тестирование' },
			{
				command: 'info',
				description: 'Информация о боте',
			},
		])

		bot.onText(/\/start/, msg => {
			const userId = msg.from?.id
			if (!userId) return
			const currentUser = this.userManager.createUser(userId)
			currentUser.startTest()
		})

		bot.onText(/\/info/, msg => {
			const userId = msg.from?.id
			if (!userId) return
			const currentUser = this.userManager.createUser(userId)
			currentUser.sendMessage(
				'Данный бот предназначен для прохождения тестирования. Введите комманду /start для начала теста',
			)
		})

		bot.on('text', msg => {
			if (msg.chat.type !== 'private') return
			const userId = msg.from?.id
			if (!userId || !msg.text) return
			const user = this.userManager.getUser(userId)
			if (!user) return
			user.onMessage(msg)
		})

		bot.on('callback_query', async query => {
			if (!query?.data) return
			const dataType = (JSON.parse(query.data) as ICallback).type

			const currentUser = this.userManager.getUser(query.from.id)
			if (!currentUser) return

			if (dataType === 'answer') {
				const data = JSON.parse(query.data) as ICallbackAnswer
				const result = await currentUser.checkAnswer(data)
				if (!result) return

				// Тест пройден
				const options: SendMessageOptions = {
					reply_markup: {
						inline_keyboard: [
							[
								{
									text: 'Узнать результат подробнее',
									callback_data: JSON.stringify({
										type: 'result',
									}),
								},
							],
						],
					},
				}

				await this.sendMessageToOwner(
					`Пользователь ${
						currentUser.name?.firstName || 'Аноним'
					} завершил тест с результатом: ${result}`,
					options,
				)

				const userDto = User2Data(currentUser)
				if (!userDto) return
				await new DB().createUser(userDto)
			} else if (dataType === 'result') {
				const data = JSON.parse(query.data) as ICallbackResult
				await this.sendMessageToOwner(
					`Данные пользователя: \nИмя: ${
						currentUser.name?.firstName
					}\nФамилия: ${currentUser.name?.lastName}\nОтчество: ${
						currentUser.name?.middleName
					}\nГруппа: ${currentUser.name?.group}\nРезультат: ${
						currentUser.currentRating
					}\nНачало прохождения теста: ${new Date(
						currentUser.startTime!,
					).toLocaleString(
						'ru-RU',
					)}\nКонец прохождения теста: ${new Date(
						currentUser.endTime!,
					).toLocaleString(
						'ru-RU',
					)}\nВремя прохождения теста: ${Math.round(
						currentUser.endTime!.getSeconds() -
							currentUser.startTime!.getSeconds(),
					)} с`,
				)
			} else {
			}
		})
	}

	registerOnEvent(
		type: keyof TelegramEvents,
		handler: IMessageHandler,
	) {
		bot.on(type, handler)
	}

	async sendMessageToOwner(
		message: string,
		options?: SendMessageOptions,
	) {
		await bot.sendMessage(adminuserId, message, options)
	}
}
