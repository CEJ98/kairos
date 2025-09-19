import { NextRequest, NextResponse } from 'next/server'
import { PersonalRecordsService } from '@/lib/personal-records'

export async function POST(request: NextRequest) {
	try {
		const { userId, exerciseId, setData } = await request.json()

		if (!userId || !exerciseId || !setData) {
			return NextResponse.json(
				{ error: 'Missing required fields' },
				{ status: 400 }
			)
		}

		const newRecords = await PersonalRecordsService.evaluateSetForRecords(
			userId,
			exerciseId,
			setData
		)

		return NextResponse.json(newRecords)
	} catch (error) {
		console.error('Error evaluating records:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}