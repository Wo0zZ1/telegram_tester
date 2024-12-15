import { readFileSync } from 'fs'

export const questions: IQuestion[] = JSON.parse(
	readFileSync(__dirname + '/questions.json', 'utf8'),
).data

export interface IQuestion {
	question: string
	answers: IAnswer[]
}

export interface IAnswer {
	text: string
	rating: number
}
