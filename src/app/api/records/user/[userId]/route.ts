import { NextRequest, NextResponse } from 'next/server'
import { PersonalRecordsService } from '@/lib/personal-records'

export async function GET(
	request: NextRequest,
	{ params }: any
) {
	try {
		const _p = (params && typeof (params as any).then === 'function') ? await params : params
		const { userId } = _p

		if (!userId) {
			return NextResponse.json(
				{ error: 'User ID is required' },
				{ status: 400 }
			)
		}

		const records = await PersonalRecordsService.getUserRecords(userId)
		return NextResponse.json(records)
	} catch (error) {
		console.error('Error fetching user records:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}
