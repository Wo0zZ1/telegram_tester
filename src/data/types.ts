import { readFileSync } from 'fs'

type MakeFieldOptional<T, V> = {
	[P in keyof T]: P extends V
		? T[P] | undefined
		: T[P] extends object
		? T[P] extends Date
			? T[P]
			: MakeFieldOptional<T[P], V>
		: T[P]
}

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

export interface IFetchDataWithId {
	name: {
		id: number
		firstName: string
		lastName: string
		middleName: string
		group: string
	}
	id: number
	userId: number
	nameId: number
	verified: boolean
	testCompleted: boolean
	currentIndex: number
	currentRating: number
	startTime: Date
	endTime: Date
}

export type IFetchData = MakeFieldOptional<
	IFetchDataWithId,
	'id' | 'nameId'
>
