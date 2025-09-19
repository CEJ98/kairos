'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Trophy, TrendingUp, Calendar, Target } from 'lucide-react'
import { PersonalRecord } from '@/lib/personal-records'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface PersonalRecordsDisplayProps {
	records: PersonalRecord[]
	title?: string
	showExerciseName?: boolean
	compact?: boolean
	className?: string
}

export function PersonalRecordsDisplay({
	records,
	title = 'Records Personales',
	showExerciseName = true,
	compact = false,
	className = ''
}: PersonalRecordsDisplayProps) {
	if (records.length === 0) {
		return (
			<Card className={className}>
				<CardContent className="flex flex-col items-center justify-center py-8">
					<Trophy className="w-12 h-12 text-gray-300 mb-4" />
					<p className="text-gray-500 text-center">
						Aún no tienes records personales.
						<br />
						¡Completa tu primer entrenamiento para empezar!
					</p>
				</CardContent>
			</Card>
		)
	}

	const getRecordIcon = (recordType: string) => {
		switch (recordType) {
			case 'MAX_WEIGHT':
				return '🏋️'
			case 'MAX_REPS':
				return '🔥'
			case 'MAX_DURATION':
				return '⏱️'
			case 'MAX_VOLUME':
				return '💪'
			default:
				return '🏆'
		}
	}

	const getRecordTypeLabel = (recordType: string): string => {
		switch (recordType) {
			case 'MAX_WEIGHT':
				return 'Peso Máximo'
			case 'MAX_REPS':
				return 'Repeticiones Máximas'
			case 'MAX_DURATION':
				return 'Duración Máxima'
			case 'MAX_VOLUME':
				return 'Volumen Máximo'
			default:
				return 'Record'
		}
	}

	const formatRecord = (record: PersonalRecord): string => {
		switch (record.recordType) {
			case 'MAX_WEIGHT':
				return `${record.value}kg${record.reps ? ` x ${record.reps}` : ''}`
			case 'MAX_REPS':
				return `${record.value} reps${record.weight ? ` @ ${record.weight}kg` : ''}`
			case 'MAX_DURATION':
				return `${Math.floor(record.value / 60)}:${(record.value % 60).toString().padStart(2, '0')}`
			case 'MAX_VOLUME':
				return `${record.value}kg total`
			default:
				return record.value.toString()
		}
	}

	const getRecordColor = (recordType: string): string => {
		switch (recordType) {
			case 'MAX_WEIGHT':
				return 'bg-blue-100 text-blue-800'
			case 'MAX_REPS':
				return 'bg-red-100 text-red-800'
			case 'MAX_DURATION':
				return 'bg-green-100 text-green-800'
			case 'MAX_VOLUME':
				return 'bg-purple-100 text-purple-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	if (compact) {
		return (
			<div className={`space-y-2 ${className}`}>
				{title && (
					<h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
						<Trophy className="w-4 h-4" />
						{title}
					</h4>
				)}
				<div className="space-y-1">
					{records.slice(0, 3).map((record, index) => (
						<div key={record.id || index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
							<div className="flex items-center gap-2">
								<span className="text-lg">{getRecordIcon(record.recordType)}</span>
								<div>
									{showExerciseName && (
										<p className="font-medium text-sm">{record.exercise?.name}</p>
									)}
									<p className="text-xs text-gray-600">{getRecordTypeLabel(record.recordType)}</p>
								</div>
							</div>
							<div className="text-right">
								<p className="font-bold text-sm">{formatRecord(record)}</p>
								<p className="text-xs text-gray-500">
									{formatDistanceToNow(new Date(record.achievedAt), { 
										addSuffix: true, 
										locale: es 
									})}
								</p>
							</div>
						</div>
					))}
				</div>
				{records.length > 3 && (
					<p className="text-xs text-gray-500 text-center">
						y {records.length - 3} más...
					</p>
				)}
			</div>
		)
	}

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Trophy className="w-5 h-5 text-yellow-600" />
					{title}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{records.map((record, index) => (
						<div key={record.id || index}>
							<div className="flex items-start justify-between">
								<div className="flex items-start gap-3">
									<div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
										<span className="text-lg">{getRecordIcon(record.recordType)}</span>
									</div>
									<div className="flex-1">
										{showExerciseName && (
											<h4 className="font-semibold text-gray-900">{record.exercise?.name}</h4>
										)}
										<div className="flex items-center gap-2 mt-1">
											<Badge 
												variant="secondary" 
												className={`text-xs ${getRecordColor(record.recordType)}`}
											>
												{getRecordTypeLabel(record.recordType)}
											</Badge>
											<div className="flex items-center gap-1 text-xs text-gray-500">
												<Calendar className="w-3 h-3" />
												{formatDistanceToNow(new Date(record.achievedAt), { 
													addSuffix: true, 
													locale: es 
												})}
											</div>
										</div>
									</div>
								</div>
								<div className="text-right">
									<div className="flex items-center gap-1 text-2xl font-bold text-gray-900">
										<TrendingUp className="w-5 h-5 text-green-600" />
										{formatRecord(record)}
									</div>
								</div>
							</div>
							{index < records.length - 1 && <Separator className="mt-4" />}
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}

export default PersonalRecordsDisplay