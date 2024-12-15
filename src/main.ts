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
} from './types'
import { bot } from './bot'
import TelegramBot from 'node-telegram-bot-api'

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
	userManager: UserManager = new UserManager()

	constructor(messageHandlers: IMessageHandler[]) {
		// Singleton pattern
		if (App.exists) return App.instance
		App.exists = true
		App.instance = this

		this._registerEventListeners(messageHandlers)
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

				this.sendMessageToOwner(
					`Пользователь ${
						currentUser.name?.firstName || 'Аноним'
					} завершил тест с результатом: ${result}`,
					options,
				)
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
						currentUser.startTime,
					).toLocaleString(
						'ru-RU',
					)}\nКонец прохождения теста: ${new Date(
						currentUser.endTime,
					).toLocaleString(
						'ru-RU',
					)}\nВремя прохождения теста: ${Math.round(
						(currentUser.endTime - currentUser.startTime) / 1000,
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
