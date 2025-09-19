'use client'

import React from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface CalendarProps {
	mode?: 'single'
	selected?: Date
	onSelect?: (date: Date | undefined) => void
	initialFocus?: boolean
	className?: string
}

export function Calendar({
	mode = 'single',
	selected,
	onSelect,
	initialFocus,
	className
}: CalendarProps) {
	const [currentMonth, setCurrentMonth] = React.useState(selected || new Date())

	// Generate calendar days
	const calendarDays = React.useMemo(() => {
		const start = startOfWeek(startOfMonth(currentMonth), { locale: es })
		const end = endOfWeek(endOfMonth(currentMonth), { locale: es })
		const days = []
		let day = start

		while (day <= end) {
			days.push(day)
			day = addDays(day, 1)
		}

		return days
	}, [currentMonth])

	const goToPreviousMonth = () => {
		setCurrentMonth(prev => {
			const newDate = new Date(prev)
			newDate.setMonth(prev.getMonth() - 1)
			return newDate
		})
	}

	const goToNextMonth = () => {
		setCurrentMonth(prev => {
			const newDate = new Date(prev)
			newDate.setMonth(prev.getMonth() + 1)
			return newDate
		})
	}

	const handleDateClick = (date: Date) => {
		if (onSelect) {
			onSelect(date)
		}
	}

	return (
		<div className={cn('p-3', className)}>
			{/* Header */}
			<div className="flex items-center justify-between mb-4">
				<Button
					variant="outline"
					size="sm"
					onClick={goToPreviousMonth}
				>
					<ChevronLeft className="h-4 w-4" />
				</Button>
				<h2 className="text-sm font-semibold">
					{format(currentMonth, 'MMMM yyyy', { locale: es })}
				</h2>
				<Button
					variant="outline"
					size="sm"
					onClick={goToNextMonth}
				>
					<ChevronRight className="h-4 w-4" />
				</Button>
			</div>

			{/* Days of week */}
			<div className="grid grid-cols-7 gap-1 mb-2">
				{['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
					<div key={day} className="text-center text-xs font-medium text-gray-500 p-2">
						{day}
					</div>
				))}
			</div>

			{/* Calendar grid */}
			<div className="grid grid-cols-7 gap-1">
				{calendarDays.map((day) => {
					const isCurrentMonth = isSameMonth(day, currentMonth)
					const isSelected = selected && isSameDay(day, selected)
					const isTodayDate = isToday(day)

					return (
						<Button
							key={day.toString()}
							variant={isSelected ? 'default' : 'ghost'}
							size="sm"
							onClick={() => handleDateClick(day)}
							className={cn(
								'h-8 w-8 p-0 font-normal',
								!isCurrentMonth && 'text-gray-400 hover:text-gray-600',
								isTodayDate && !isSelected && 'bg-blue-100 text-blue-600',
								isSelected && 'bg-blue-600 text-white hover:bg-blue-700'
							)}
						>
							{format(day, 'd')}
						</Button>
					)
				})}
			</div>
		</div>
	)
}

export default Calendar