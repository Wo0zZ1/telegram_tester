import TelegramBot, { TelegramEvents } from 'node-telegram-bot-api'
import { UserManager } from './UserManager'
import { IQuestion, questions } from './data/types'
import { config } from 'dotenv'
import { ICallbackData, IMessageHandler } from './types'

config()

const API_KEY = process.env.TG_API_KEY!
// console.log(process.env.TG_API_KEY) // API Key
const adminChatId = process.env.ADMIN_CHAT_ID!
// console.log(adminChatId) // Admin ID

export interface IApp {
	bot: TelegramBot
	userManager: UserManager
	questions: IQuestion[]
	_registerEventListeners(messageHandlers: IMessageHandler[]): void
	registerEvent(
		type: keyof TelegramEvents,
		handler: IMessageHandler,
	): void
	sendMessageToOwner(message: string): void
}

export class App implements IApp {
	bot
	questions
	userManager

	constructor(messageHandlers: IMessageHandler[]) {
		// Создаем экземпляр бота
		this.bot = new TelegramBot(API_KEY, { polling: true })

		this.questions = questions

		this.userManager = new UserManager(this.bot)

		this._registerEventListeners(messageHandlers)
	}

	_registerEventListeners(messageHandlers: IMessageHandler[]) {
		messageHandlers.forEach(handler =>
			this.registerEvent('message', handler),
		)

		this.bot.onText(/\/start/, msg => {
			const chatId = msg.chat.id
			const currentUser = this.userManager.createUser(
				chatId,
				msg.from?.first_name || 'Аноним',
			)
			currentUser.startTest()
		})

		this.bot.on('callback_query', query => {
			if (!query?.data || !query.message?.chat) return
			const data: ICallbackData = JSON.parse(query.data)
			const currentUser = this.userManager.getUser(
				query.message.chat.id,
			)
			if (!currentUser) return

			if (data.type === 'answer') {
				const result = currentUser.checkAnswer(data)
				if (!result) return
				this.sendMessageToOwner(
					`Пользователь ${currentUser.name} завершил тест с результатом: ${result}`,
				)
			}
		})
	}

	registerEvent(
		type: keyof TelegramEvents,
		handler: IMessageHandler,
	) {
		this.bot.on(type, handler.bind(this.bot))
	}

	sendMessageToOwner(message: string) {
		this.bot.sendMessage(adminChatId, message)
	}
}
