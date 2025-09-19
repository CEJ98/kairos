'use client'

import React from 'react'
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

export interface RevenueData { date: string; revenue: number; clients: number; sessions: number; projected?: number }

export default function RevenueChartInner({ data, type }: { data: RevenueData[]; type: 'line' | 'area' | 'bar' }) {
  const commonProps = { data, margin: { top: 5, right: 30, left: 20, bottom: 5 } }

  return (
    <ResponsiveContainer width="100%" height={300}>
      {type === 'line' ? (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value: any, name: any) => [`$${value}`, name === 'revenue' ? 'Ingresos' : name]} />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} name="Ingresos" />
          {data.some(d => d.projected) && (
            <Line type="monotone" dataKey="projected" stroke="#10B981" strokeDasharray="5 5" name="Proyectado" />
          )}
        </LineChart>
      ) : type === 'bar' ? (
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value: any, name: any) => [`$${value}`, name === 'revenue' ? 'Ingresos' : name]} />
          <Legend />
          <Bar dataKey="revenue" fill="#3B82F6" name="Ingresos" />
        </BarChart>
      ) : (
        <AreaChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value: any, name: any) => [`$${value}`, name === 'revenue' ? 'Ingresos' : name]} />
          <Legend />
          <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} name="Ingresos" />
          {data.some(d => d.projected) && (
            <Area type="monotone" dataKey="projected" stroke="#10B981" fill="#10B981" fillOpacity={0.2} name="Proyectado" />
          )}
        </AreaChart>
      )}
    </ResponsiveContainer>
  )
}

