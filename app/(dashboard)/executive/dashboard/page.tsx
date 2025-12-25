"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  BookOpen,
  GraduationCap,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface AnalyticsData {
  metrics: {
    totalRevenue: number;
    thisMonthRevenue: number;
    revenueGrowth: number;
    totalStudents: number;
    thisMonthStudents: number;
    studentGrowth: number;
    activeSections: number;
    totalSections: number;
    activeEnrollments: number;
    thisMonthEnrollments: number;
    enrollmentGrowth: number;
  };
  monthlyData: { month: string; revenue: number; enrollments: number }[];
  revenueByProgram: { name: string; value: number }[];
  tutorSummary: {
    id: string;
    name: string;
    avatar: string | null;
    sections: number;
    students: number;
    materials: number;
  }[];
  comparison: {
    lastMonthRevenue: number;
    lastMonthStudents: number;
    lastMonthEnrollments: number;
  };
}

const COLORS = [
  "#0ea5e9",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export default function ExecutiveDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/executive/analytics?range=${dateRange}`
      );
      const result = await response.json();

      if (response.ok) {
        setData(result);
      } else {
        toast.error(result.error || "Failed to load analytics");
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("An error occurred while loading data");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `Rp ${value.toLocaleString("id-ID")}`;
  };

  const TrendIndicator = ({
    value,
    suffix = "%",
  }: {
    value: number;
    suffix?: string;
  }) => {
    const isPositive = value > 0;
    const isNeutral = value === 0;

    return (
      <div
        className={`flex items-center gap-1 text-sm font-medium ${
          isNeutral
            ? "text-muted-foreground"
            : isPositive
            ? "text-green-600"
            : "text-red-600"
        }`}
      >
        {isNeutral ? null : isPositive ? (
          <TrendingUp className="h-4 w-4" />
        ) : (
          <TrendingDown className="h-4 w-4" />
        )}
        <span>
          {isPositive ? "+" : ""}
          {value}
          {suffix}
        </span>
        <span className="text-muted-foreground font-normal">vs bulan lalu</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Failed to load analytics</p>
        <Button onClick={fetchAnalytics}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with date range */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Executive Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive analytics and business insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="12m">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold mt-1">
                  {formatCurrency(data.metrics.totalRevenue)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Bulan ini: {formatCurrency(data.metrics.thisMonthRevenue)}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4">
              <TrendIndicator value={data.metrics.revenueGrowth} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Siswa</p>
                <p className="text-2xl font-bold mt-1">
                  {data.metrics.totalStudents.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Bulan ini: +{data.metrics.thisMonthStudents}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <TrendIndicator value={data.metrics.studentGrowth} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Sections</p>
                <p className="text-2xl font-bold mt-1">
                  {data.metrics.activeSections}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  dari {data.metrics.totalSections} total
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Enrollments</p>
                <p className="text-2xl font-bold mt-1">
                  {data.metrics.activeEnrollments}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Bulan ini: +{data.metrics.thisMonthEnrollments}
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <TrendIndicator value={data.metrics.enrollmentGrowth} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend (12 Bulan)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={data.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis
                  fontSize={12}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
                />
                <Tooltip
                  formatter={(value: number) => [
                    formatCurrency(value),
                    "Revenue",
                  ]}
                  labelStyle={{ color: "#666" }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#22c55e"
                  fill="#22c55e"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Enrollment Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Trend (12 Bulan)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip
                  formatter={(value: number) => [value, "Enrollments"]}
                />
                <Line
                  type="monotone"
                  dataKey="enrollments"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ fill: "#0ea5e9" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by Program */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Program</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.revenueByProgram}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.revenueByProgram.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tutor Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Top Tutor Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.tutorSummary.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No tutor data available
                </p>
              ) : (
                data.tutorSummary.map((tutor, index) => (
                  <div
                    key={tutor.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="text-lg font-bold text-muted-foreground w-6">
                      #{index + 1}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={tutor.avatar || undefined} />
                      <AvatarFallback>{tutor.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{tutor.name}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{tutor.sections} sections</span>
                        <span>{tutor.students} siswa</span>
                        <span>{tutor.materials} materi</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparison Card */}
      <Card>
        <CardHeader>
          <CardTitle>Perbandingan Bulan Lalu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">
                Revenue Bulan Lalu
              </p>
              <p className="text-xl font-bold mt-1">
                {formatCurrency(data.comparison.lastMonthRevenue)}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">
                Siswa Baru Bulan Lalu
              </p>
              <p className="text-xl font-bold mt-1">
                {data.comparison.lastMonthStudents}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground">
                Enrollments Bulan Lalu
              </p>
              <p className="text-xl font-bold mt-1">
                {data.comparison.lastMonthEnrollments}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
