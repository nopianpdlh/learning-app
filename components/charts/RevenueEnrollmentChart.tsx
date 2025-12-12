"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface ChartDataPoint {
  date: string;
  revenue: number;
  enrollments: number;
}

interface RevenueEnrollmentChartProps {
  data: ChartDataPoint[];
  title?: string;
  description?: string;
}

const chartConfig = {
  revenue: {
    label: "Revenue (Rp)",
    color: "hsl(217, 91%, 60%)", // Blue
  },
  enrollments: {
    label: "Enrollments",
    color: "hsl(142, 71%, 45%)", // Green
  },
} satisfies ChartConfig;

type TimeRange = "7d" | "30d" | "90d" | "all";

export function RevenueEnrollmentChart({
  data,
  title = "Revenue & Enrollment Statistics",
  description = "Revenue and student enrollment trends",
}: RevenueEnrollmentChartProps) {
  const [timeRange, setTimeRange] = React.useState<TimeRange>("30d");

  const filteredData = React.useMemo(() => {
    const now = new Date();
    let daysToSubtract = 30;

    switch (timeRange) {
      case "7d":
        daysToSubtract = 7;
        break;
      case "30d":
        daysToSubtract = 30;
        break;
      case "90d":
        daysToSubtract = 90;
        break;
      case "all":
        return data;
    }

    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysToSubtract);

    return data.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate;
    });
  }, [data, timeRange]);

  // Calculate totals for the selected period
  const totals = React.useMemo(() => {
    return filteredData.reduce(
      (acc, item) => ({
        revenue: acc.revenue + item.revenue,
        enrollments: acc.enrollments + item.enrollments,
      }),
      { revenue: 0, enrollments: 0 }
    );
  }, [filteredData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex">
          <div className="flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left sm:border-l sm:border-t-0 sm:px-8 sm:py-6">
            <span className="text-xs text-muted-foreground">Total Revenue</span>
            <span className="text-lg font-bold leading-none sm:text-2xl">
              {formatCurrency(totals.revenue)}
            </span>
          </div>
          <div className="flex flex-1 flex-col justify-center gap-1 border-t border-l px-6 py-4 text-left sm:border-t-0 sm:px-8 sm:py-6">
            <span className="text-xs text-muted-foreground">
              Total Enrollments
            </span>
            <span className="text-lg font-bold leading-none sm:text-2xl">
              {totals.enrollments}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="flex items-center justify-end mb-4">
          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as TimeRange)}
          >
            <SelectTrigger className="w-[160px] rounded-lg">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent className="rounded-xl bg-background">
              <SelectItem value="7d" className="rounded-lg">
                Last 7 Days
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 Days
              </SelectItem>
              <SelectItem value="90d" className="rounded-lg">
                Last 90 Days
              </SelectItem>
              <SelectItem value="all" className="rounded-lg">
                All Data
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillEnrollments" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-enrollments)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-enrollments)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("id-ID", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${(value / 1000000).toFixed(0)}jt`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("id-ID", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                  formatter={(value, name) => {
                    if (name === "revenue") {
                      return (
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-sm"
                            style={{
                              backgroundColor: chartConfig.revenue.color,
                            }}
                          />
                          <span className="text-muted-foreground">
                            {chartConfig.revenue.label}:
                          </span>
                          <span className="font-mono font-medium">
                            {formatCurrency(value as number)}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-sm"
                          style={{
                            backgroundColor: chartConfig.enrollments.color,
                          }}
                        />
                        <span className="text-muted-foreground">
                          {chartConfig.enrollments.label}:
                        </span>
                        <span className="font-mono font-medium">{value}</span>
                      </div>
                    );
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              yAxisId="left"
              dataKey="revenue"
              type="monotone"
              fill="url(#fillRevenue)"
              stroke="var(--color-revenue)"
              stackId="a"
            />
            <Area
              yAxisId="right"
              dataKey="enrollments"
              type="monotone"
              fill="url(#fillEnrollments)"
              stroke="var(--color-enrollments)"
              stackId="b"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
