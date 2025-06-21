// This file will be created.
'use client';
import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';

type CaseStrengthMeterProps = {
  value: number;
};

export function CaseStrengthMeter({ value }: CaseStrengthMeterProps) {
  const data = [{ value }];
  const color = `hsl(120, ${Math.round(value * 0.6 + 40)}%, ${Math.round(value * 0.25 + 45)}%)`; // Green spectrum

  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="70%"
          outerRadius="90%"
          barSize={20}
          data={data}
          startAngle={180}
          endAngle={0}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
          <RadialBar
            background={{ fill: 'hsl(var(--muted))' }}
            dataKey="value"
            angleAxisId={0}
            fill={color}
            cornerRadius={10}
          />
          <text
            x="50%"
            y="75%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground text-3xl font-bold font-headline"
          >
            {`${value}%`}
          </text>
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
}
