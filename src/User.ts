import TelegramBot from 'node-telegram-bot-api'
import { userId, ICallbackAnswer, userName } from './types/index'
import { questions, type IQuestion } from './data/types'
import { SendMessageOptions } from 'node-telegram-bot-api'
import { bot } from './bot'

export interface IUserProps {
	userId: userId
	name?: userName
	verified?: boolean
	testCompleted?: boolean
	currentIndex?: number
	currentRating?: number
	startTime?: Date
	endTime?: Date
}

export type IRequiredUserProps = Required<IUserProps>

export type IUser = Required<
	Omit<IUserProps, 'name' | 'startTime' | 'endTime'>
> &
	Pick<IUserProps, 'name' | 'startTime' | 'endTime'>

export class User implements IUser {
	userId
	name
	verified
	testCompleted
	currentIndex
	currentRating
	startTime
	endTime

	constructor(userData: IUserProps) {
		this.userId = userData.userId
		this.name = userData.name
		this.verified = userData.verified || false
		this.testCompleted = userData.testCompleted || false
		this.currentIndex = userData.currentIndex || 0
		this.currentRating = userData.currentRating || 0
		this.startTime = userData.startTime
		this.endTime = userData.endTime
	}

	getProps(): IRequiredUserProps | undefined {
		if (!this.name || !this.startTime || !this.endTime) return
		return {
			userId: this.userId,
			name: this.name,
			verified: this.verified,
			testCompleted: this.testCompleted,
			currentIndex: this.currentIndex,
			currentRating: this.currentRating,
			startTime: this.startTime,
			endTime: this.endTime,
		}
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
		this.startTime = new Date()
		await this.sendMessage('Привет! Для начала давай познакомимся!')
		await this.sendMessage(
			'Введи ФИО и группу через пробел (например: Иванов Иван Иванович ИТ-21):',
		)
	}

	async finishTest() {
		this.endTime = new Date()
		await this.sendMessage(
			`${
				this.name!.firstName
			}, спасибо за прохождение теста! Ваш общий рейтинг: ${
				this.currentRating
			}`,
		)
	}
}
