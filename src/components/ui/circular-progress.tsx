interface CircularProgressProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  color?: string
  showValue?: boolean
  label?: string
  subtitle?: string
}

export function CircularProgress({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  color = "rgb(59, 130, 246)",
  showValue = true,
  label,
  subtitle,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / max) * circumference
  const percentage = Math.round((value / max) * 100)

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgb(229, 231, 235)"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="dark:stroke-gray-700"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            {showValue && (
              <div className="text-2xl font-bold dark:text-gray-100">{value.toLocaleString()}</div>
            )}
            {max && (
              <div className="text-xs text-muted-foreground dark:text-gray-400">
                /{max.toLocaleString()}
              </div>
            )}
            {!showValue && (
              <div className="text-xl font-bold dark:text-gray-100">{percentage}%</div>
            )}
          </div>
        </div>
      </div>
      {(label || subtitle) && (
        <div className="mt-3 text-center">
          {label && <div className="font-semibold text-sm dark:text-gray-200">{label}</div>}
          {subtitle && (
            <div className="text-xs text-muted-foreground dark:text-gray-400 mt-1">{subtitle}</div>
          )}
        </div>
      )}
    </div>
  )
}