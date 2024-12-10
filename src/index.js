import TelegramBot from 'node-telegram-bot-api'
import fs from 'fs'
import config from 'dotenv'

config.config()

const API_KEY = process.env.TG_API_KEY
// console.log(process.env.TG_API_KEY) // API Key
const adminChatId = process.env.ADMIN_CHAT_ID
// console.log(adminChatId) // Admin ID

// Токен вашего бота
const token = API_KEY

// Создаем экземпляр бота
const bot = new TelegramBot(token, { polling: true })

// Массив с вопросами и вариантами ответов
const questions = JSON.parse(
	fs.readFileSync(
		import.meta.dirname + '/data/questions.json',
		'utf8',
	),
).questions

let currentUser = {}

// Команда /start для запуска теста
bot.onText(/\/start/, msg => {
	try {
		const chatId = msg.chat.id
		currentUser[chatId] = {
			name: msg.from.first_name,
			rating: 0,
			questionIndex: 0,
		}

		sendNextQuestion(chatId)
	} catch (error) {}
})

// Обработчик нажатия кнопок
bot.on('callback_query', query => {
	try {
		const data = JSON.parse(query.data)
		const chatId = query.message.chat.id

		if (data.type === 'answer') {
			const userData = currentUser[chatId]

			// Накапливаем рейтинг
			userData.rating += data.rating

			// Переходим к следующему вопросу
			userData.questionIndex++

			if (userData.questionIndex >= questions.length) {
				// Тест завершен, отправляем результат
				bot.sendMessage(
					chatId,
					`Тест завершён! Ваш общий рейтинг: ${userData.rating}`,
				)

				// Очищаем данные текущего пользователя
				delete currentUser[chatId]

				bot.sendMessage(
					adminChatId,
					`Пользователь ${userData.name} завершил тест с рейтингом ${userData.rating}`,
				)
			} else {
				sendNextQuestion(chatId)
			}
		}
	} catch (error) {
		console.error(error)
	}
})

// Функция отправки следующего вопроса
function sendNextQuestion(chatId) {
	try {
		const userData = currentUser[chatId]
		const question = questions[userData.questionIndex]

		let message = `<b>${question.question}</b>\n\n`

		question.answers.map((answer, index) => {
			message += `${index + 1}. ${answer.text}\n`
		})

		const options = {
			parse_mode: 'HTML',
			reply_markup: {
				inline_keyboard: [
					question.answers.map((a, index) => ({
						text: `${index + 1}`,
						callback_data: JSON.stringify({
							type: 'answer',
							selectedAnswerIndex: index + 1,
							rating: a.rating,
						}),
					})),
				],
			},
		}

		bot.sendMessage(chatId, message, options)
	} catch (error) {
		console.error(error)
	}
}
