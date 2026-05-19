'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface Props {
  historial: any[]
}

export default function GraficoHistorial({ historial }: Props) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={historial} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <XAxis
          dataKey="created_at"
          tickFormatter={(val) => new Date(val).toLocaleDateString()}
          stroke="#888"
        />
        <YAxis yAxisId="left" stroke="#3b82f6" />
        <YAxis yAxisId="right" orientation="right" stroke="#22c55e" />
        <Tooltip
          labelFormatter={(val) => new Date(val).toLocaleString()}
          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
          itemStyle={{ color: '#fff' }}
        />
        <Legend />
        <Line yAxisId="left" type="monotone" name="Puntuación" dataKey="puntuacion" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        <Line yAxisId="right" type="monotone" name="Precisión (%)" dataKey="precision_porcentaje" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
