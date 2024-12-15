import TelegramBot from 'node-telegram-bot-api'
import { userId, ICallbackAnswer, userName } from './types/index'
import { questions, type IQuestion } from './data/types'
import { SendMessageOptions } from 'node-telegram-bot-api'
import { bot } from './bot'

export interface IUser {
	userId: userId
	name: userName | undefined
	currentIndex: number
	currentRating: number
	verified: boolean
	startTime: number
	durationTime: number
	sendMessage(
		message: string,
		options?: TelegramBot.SendMessageOptions,
	): void
	sendNextQuestion(): void
	getCurrentQuestion(questions: IQuestion[]): IQuestion
	incrementRating(rating: number): number
	checkAnswer(data: ICallbackAnswer): Promise<number | undefined>
	finishTest(): void
	checkFIO(text: string): void
	onMessage(msg: TelegramBot.Message): void
	startTest(): void
	startTest(): void
}

export class User implements IUser {
	userId
	name
	verified
	testCompleted
	currentIndex
	currentRating
	startTime
	endTime
	durationTime

	// TODO Name
	constructor(userId: userId, name?: userName) {
		this.userId = userId
		this.name = name
		this.verified = false
		this.testCompleted = false
		this.currentIndex = 0
		this.currentRating = 0
		this.startTime = 0
		this.endTime = 0
		this.durationTime = 0
	}

	async sendMessage(message: string, options?: SendMessageOptions) {
		try {
			await bot.sendMessage(this.userId, message, options)
		} catch (error) {
			console.error(error)
		}
	}

	async sendNextQuestion() {
		try {
			if (!this.verified) return
			const question = this.getCurrentQuestion()

			let message = `<b>${question.question}</b>\n\n`

			question.answers.map((answer, index) => {
				message += `${index + 1}. ${answer.text}\n`
			})

			const options: SendMessageOptions = {
				parse_mode: 'HTML',
				reply_markup: {
					inline_keyboard: [
						question.answers.map((_, index) => ({
							text: `${index + 1}`,
							callback_data: JSON.stringify({
								type: 'answer',
								questionIndex: this.currentIndex,
								selectedIndex: index,
							}),
						})),
					],
				},
			}

			await this.sendMessage(message, options)
		} catch (error) {
			console.error(error)
		}
	}

	getCurrentQuestion() {
		return questions[this.currentIndex]
	}

	incrementRating(rating: number) {
		return (this.currentRating += rating)
	}

	async checkAnswer(data: ICallbackAnswer) {
		try {
			if (
				data.questionIndex !== this.currentIndex ||
				this.currentIndex >= questions.length
			)
				return

			// Накапливаем рейтинг
			this.incrementRating(
				questions[data.questionIndex].answers[data.selectedIndex]
					.rating,
			)
			// Переходим к следующему вопросу
			this.currentIndex++

			if (this.currentIndex < questions.length) {
				this.sendNextQuestion()
				return
			}

			// Тест завершен, отправляем результат
			this.testCompleted = true
			await this.finishTest()
			return this.currentRating
		} catch (error) {
			console.error(error)
		}
	}

	async checkFIO(text: string) {
		if (/^([А-яA-z]+ ){3}[^ ]+$/.test(text)) {
			const [lastName, firstName, middleName, group] = text.split(' ')
			this.name = { lastName, firstName, middleName, group }
			this.verified = true
			await this.sendMessage(
				`Спасибо, ${firstName}! Теперь начнем тестирование!`,
			)
			await this.sendNextQuestion()
		} else {
			await this.sendMessage(
				'Неверный формат!\n\nПожалуйста, введи ФИО и группу через пробел (например: Иванов Иван Иванович ИТ-21):',
			)
		}
	}

	async onMessage(msg: TelegramBot.Message) {
		// If msg is command - skip
		if (
			(await bot.getMyCommands()).find(
				command => '/' + command.command === msg.text,
			)
		)
			return
		// If not verified - check FIO
		if (!this.verified) return await this.checkFIO(msg?.text || '')
		// If verified - send message
		return await this.sendMessage(
			`${
				this.name!.firstName
			}, ты должен ответить на вопрос, нажав на одну из кнопок под сообщением!`,
		)
	}

	async startTest() {
		if (this.testCompleted) {
			return await this.sendMessage(
				`Тест уже пройден! Твой рейтинг: ${this.currentRating}`,
			)
		}
		if (this.verified) {
			await this.sendMessage(
				`Привет, ${
					this.name!.firstName
				}! Пройди тест до конца, чтобы узнать свой рейтинг!`,
			)
			return this.sendNextQuestion()
		}
		this.startTime = Date.now()
		await this.sendMessage('Привет! Для начала давай познакомимся!')
		await this.sendMessage(
			'Введи ФИО и группу через пробел (например: Иванов Иван Иванович ИТ-21):',
		)
	}

	async finishTest() {
		this.endTime = Date.now()
		this.durationTime = this.endTime - this.startTime
		await this.sendMessage(
			`${
				this.name!.firstName
			}, спасибо за прохождение теста! Ваш общий рейтинг: ${
				this.currentRating
			}`,
		)
	}
}
