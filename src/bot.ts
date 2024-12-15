import TelegramBot from 'node-telegram-bot-api'

import { config } from 'dotenv'

config()

const API_KEY = process.env.TG_API_KEY!
// console.log(process.env.TG_API_KEY) // API Key

export const bot = new TelegramBot(API_KEY, { polling: true })
