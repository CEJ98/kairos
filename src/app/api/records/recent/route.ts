import { NextRequest, NextResponse } from 'next/server'
import { PersonalRecordsService } from '@/lib/personal-records'

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const userId = searchParams.get('userId')
		const limitParam = searchParams.get('limit')
		const limit = limitParam ? parseInt(limitParam, 10) : 5

		if (!userId) {
			return NextResponse.json(
				{ error: 'User ID is required' },
				{ status: 400 }
			)
		}

		const records = await PersonalRecordsService.getRecentRecords(userId, limit)
		return NextResponse.json(records)
	} catch (error) {
		console.error('Error fetching recent records:', error)
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		)
	}
}