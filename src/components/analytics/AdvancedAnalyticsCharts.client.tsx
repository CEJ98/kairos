'use client'

import React from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

export function OverviewTrendsChart({ data }: { data: Array<{ date: string; clients: number; workouts: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" fontSize={10} interval="preserveStartEnd" />
        <YAxis fontSize={10} />
        <Tooltip contentStyle={{ fontSize: '12px' }} />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        <Line type="monotone" dataKey="clients" stroke="#10B981" name="Clientes" strokeWidth={2} />
        <Line type="monotone" dataKey="workouts" stroke="#3B82F6" name="Entrenamientos" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function ClientsDistributionPie({ active, total }: { active: number; total: number }) {
  const data = [
    { name: 'Activos', value: active },
    { name: 'Inactivos', value: Math.max(0, total - active) }
  ]
  const COLORS = ['#10B981', '#EF4444']
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={60} dataKey="value">
          {[0, 1].map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ fontSize: '12px' }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function WorkoutsAreaMain({ data }: { data: Array<{ date: string; workouts: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" fontSize={10} interval="preserveStartEnd" />
        <YAxis fontSize={10} />
        <Tooltip contentStyle={{ fontSize: '12px' }} />
        <Area type="monotone" dataKey="workouts" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function RevenueBarMain({ data }: { data: Array<{ date: string; revenue: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" fontSize={10} interval="preserveStartEnd" />
        <YAxis fontSize={10} />
        <Tooltip contentStyle={{ fontSize: '12px' }} />
        <Bar dataKey="revenue" fill="#10B981" />
      </BarChart>
    </ResponsiveContainer>
  )
}

