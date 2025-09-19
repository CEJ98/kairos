import { NextRequest, NextResponse } from 'next/server'
import { PersonalRecordsService } from '@/lib/personal-records'

export async function GET(
	request: NextRequest,
	{ params }: any
) {
	try {
		const _p = (params && typeof (params as any).then === 'function') ? await params : params
		const { exerciseId } = _p
		const { searchParams } = new URL(request.url)
		const userId = searchParams.get('userId')

		if (!userId || !exerciseId) {
			return NextResponse.json(
				{ error: 'User ID and Exercise ID are required' },
				{ status: 400 }
			)
		}

		const records = await PersonalRecordsService.getExerciseRecords(userId, exerciseId)
		return NextResponse.json(records)
	} catch (error) {
		console.error('Error fetching exercise records:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
