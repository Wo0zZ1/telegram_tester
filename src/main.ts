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

const adminChatId = process.env.ADMIN_CHAT_ID!
// console.log(adminChatId) // Admin ID

export interface IApp {
	userManager: UserManager
	_registerEventListeners(messageHandlers: IMessageHandler[]): void
	registerEvent(
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
			this.registerEvent('message', handler),
		)

		bot.setMyCommands([
			{ command: 'start', description: 'Начать тестирование' },
			{
				command: 'info',
				description: 'Информация о боте',
			},
		])

		bot.onText(/\/start/, msg => {
			const chatId = msg.chat.id
			const currentUser = this.userManager.createUser(chatId)
			currentUser.startTest()
		})

		bot.onText(/\/info/, msg => {
			const chatId = msg.chat.id
			const currentUser = this.userManager.createUser(chatId)
			currentUser.sendMessage(
				'Данный бот предназначен для прохождения тестирования. Введите комманду /start для начала теста',
			)
		})

		bot.on('message', msg => {
			const chatId = msg.chat.id
			const user = this.userManager.getUser(chatId)
			if (!user || !msg?.text) return
			user.onMessage(msg)
		})

		bot.on('callback_query', async query => {
			// console.log(query)

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

	registerEvent(
		type: keyof TelegramEvents,
		handler: IMessageHandler,
	) {
		bot.on(type, handler.bind(bot))
	}

	async sendMessageToOwner(
		message: string,
		options?: SendMessageOptions,
	) {
		await bot.sendMessage(adminChatId, message, options)
	}
}
