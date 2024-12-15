import { bot } from './bot'
import { App } from './main'
import { IMessageHandler } from './types'

const messageHandlers: IMessageHandler[] = [
	function (msg) {
		if (msg.text === 'ping') bot.sendMessage(msg.chat.id, 'pong')
	},
]

const app = new App(messageHandlers)

app.sendMessageToOwner('Бот запущен!')
