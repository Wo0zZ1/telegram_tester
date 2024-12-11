import TelegramBot, {
	SendMessageOptions,
} from 'node-telegram-bot-api'
import { chatId, ICallbackData } from './types/index.ts'
import { questions, type IQuestion } from './data/types.ts'

export interface IUser {
	bot: TelegramBot
	chatId: chatId
	// TODO Name
	name: string
	currentIndex: number
	currentRating: number
	sendMessage(
		message: string,
		options?: TelegramBot.SendMessageOptions,
	): void
	sendNextQuestion(): void
	getCurrentQuestion(questions: IQuestion[]): IQuestion
	incrementRating(rating: number): number
	checkAnswer(data: ICallbackData): number | null
	startTest(): void
}

export class User implements IUser {
	bot
	chatId
	name
	currentIndex
	currentRating

	// TODO Name
	constructor(bot: TelegramBot, chatId: chatId, name: string) {
		this.bot = bot
		this.chatId = chatId
		this.name = name
		this.currentIndex = 0
		this.currentRating = 0
	}

	async sendMessage(
		message: string,
		options?: TelegramBot.SendMessageOptions,
	) {
		await this.bot.sendMessage(this.chatId, message, options)
	}

	async sendNextQuestion() {
		const question = this.getCurrentQuestion()

		let message = `<b>${question.question}</b>\n\n`

		question.answers.map((answer, index) => {
			message += `${index + 1}. ${answer.text}\n`
		})

		const callbackData: ICallbackData[] = question.answers.map(
			(a, index) => ({
				type: 'answer',
				selectedAnswerIndex: index,
				rating: a.rating,
			}),
		)

		const options: SendMessageOptions = {
			parse_mode: 'HTML',
			reply_markup: {
				inline_keyboard: [
					question.answers.map((_, index) => ({
						text: `${index + 1}`,
						callback_data: JSON.stringify(callbackData[index]),
					})),
				],
			},
		}

		await this.sendMessage(message, options)
	}

	getCurrentQuestion() {
		return questions[this.currentIndex]
	}

	incrementRating(rating: number) {
		return (this.currentRating += rating)
	}

	checkAnswer(data: ICallbackData) {
		if (this.currentIndex >= questions.length) return null

		// Накапливаем рейтинг
		this.incrementRating(data.rating)
		// Переходим к следующему вопросу
		this.currentIndex++

		if (this.currentIndex < questions.length) {
			this.sendNextQuestion()
			return null
		}

		// Тест завершен, отправляем результат
		this.finishTest()
		return this.currentRating
	}

	async finishTest() {
		await this.sendMessage(
			`Тест завершён! Ваш общий рейтинг: ${this.currentRating}`,
		)
		// TODO analytics
	}

	async startTest() {
		await this.sendMessage('Привет! Давай начнем тестирование!')
		// TODO ФИОГ
		await this.sendNextQuestion()
	}
}
