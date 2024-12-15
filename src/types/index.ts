import TelegramBot from 'node-telegram-bot-api'

export type chatId = number | string

export type userName = {
	firstName: string
	lastName: string
	middleName: string
	group: string
}

export type IMessageHandler = (
	this: TelegramBot,
	msg: TelegramBot.Message,
) => void

export interface ICallback {
	type: string
}

export interface ICallbackAnswer extends ICallback {
	selectedAnswerIndex: number
	rating: number
}

export interface ICallbackResult extends ICallback {}
