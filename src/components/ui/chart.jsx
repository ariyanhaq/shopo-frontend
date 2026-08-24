/**
 * @file chart.jsx
 * @description Official Shadcn UI Chart components wrapper for Recharts with responsive container, tooltip, and legend styling.
 */
import * as React from 'react';
import * as RechartsPrimitive from 'recharts';
import { cn } from '@/lib/utils';

// Format: { [key: string]: { label: string, color: string, icon?: React.ComponentType } }
const ChartContext = React.createContext(null);

function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }
  return context;
}

export function ChartContainer({
  id,
  className,
  children,
  config = {},
  ...props
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = RechartsPrimitive.Tooltip;

export function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = 'dot',
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}) {
  const { config } = useChart();

  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null;
    }

    const [item] = payload;
    const key = `${labelKey || item.dataKey || item.name || 'value'}`;
    const itemConfig = config[key] || {};
    const value =
      !labelKey && typeof label === 'string'
        ? config[label]?.label || label
        : itemConfig?.label;

    if (labelFormatter) {
      return (
        <div className={cn('font-semibold text-slate-900 dark:text-white', labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      );
    }

    if (!value) {
      return null;
    }

    return <div className={cn('font-semibold text-slate-900 dark:text-white', labelClassName)}>{value}</div>;
  }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey]);

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        'grid min-w-[10rem] items-start gap-1.5 rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#18181b] p-3 text-xs shadow-xl backdrop-blur-md text-slate-900 dark:text-zinc-100',
        className
      )}
    >
      {tooltipLabel}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = `${nameKey || item.name || item.dataKey || 'value'}`;
          const itemConfig = config[key] || {};
          const indicatorColor = color || item.payload?.fill || item.color;

          return (
            <div
              key={item.dataKey || index}
              className={cn(
                'flex w-full items-center justify-between gap-2',
                indicator === 'dot' && 'items-center'
              )}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {!hideIndicator && (
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: indicatorColor,
                    }}
                  />
                )}
                <span className="text-slate-500 dark:text-zinc-400 truncate">
                  {itemConfig?.label || item.name}
                </span>
              </div>
              {item.value !== undefined && (
                <span className="font-bold font-mono text-slate-900 dark:text-white">
                  {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const ChartLegend = RechartsPrimitive.Legend;
