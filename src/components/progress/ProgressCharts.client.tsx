'use client'

import React from 'react'
import { ResponsiveContainer, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts'

export interface LinePoint { date: string; value: number }

export function LineChartBlock({ data, color = '#3b82f6', height = 200 }: { data: LinePoint[]; color?: string; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} />
      </RechartsLineChart>
    </ResponsiveContainer>
  )
}

export function TopOneRMChart({ data }: { data: Array<{ exercise: { name: string }; oneRepMax: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="exercise.name" angle={-45} textAnchor="end" height={80} />
        <YAxis />
        <Tooltip />
        <Bar dataKey="oneRepMax" fill="#f59e0b" />
      </BarChart>
    </ResponsiveContainer>
  )
}

