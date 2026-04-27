// @ts-nocheck
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { Link } from '@tanstack/react-router';
import { getAnalytics, parseAnalyticsResponse } from '../services/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area,
  Legend
} from 'recharts';
import { 
  Loader2, 
  TrendingUp, 
  Users, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Activity,
  PieChart as PieChartIcon,
  BarChart3,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const Analytics = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const res = await getAnalytics();
      return parseAnalyticsResponse(res);
    },
    refetchInterval: 30000, // Refresh every 30 seconds for "real-time" feel
    enabled: !!(isAuthenticated && user?.role === 'admin'),
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md w-full border-border shadow-card p-8 text-center space-y-6">
          <AlertCircle className="w-16 h-16 mx-auto text-destructive" />
          <h2 className="text-2xl font-bold font-display">Access Denied</h2>
          <p className="text-muted-foreground">This page is restricted to administrators only.</p>
          <div className="pt-4">
            <Link to="/" className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors w-full inline-block">
              Go to Home
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (isLoading) return <AnalyticsLoading />;
  if (error) return <AnalyticsError retry={refetch} />;

  // Prepare data for charts
  const issueStatusData = [
    { name: 'Open', value: data.issues?.open || 0, color: '#f59e0b' },
    { name: 'In Progress', value: data.issues?.inProgress || 0, color: '#3b82f6' },
    { name: 'Resolved', value: data.issues?.resolved || 0, color: '#10b981' },
  ];

  const categoryData = Object.entries(data.issues?.categoryBreakdown || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' '),
    count: value,
  })).sort((a, b) => b.count - a.count);

  const userData = Object.entries(data.users?.breakdown || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: value,
  }));

  const trendData = (data.trends?.monthly || []).map(item => {
    const [year, month] = item.month.split('-');
    const date = new Date(year, parseInt(month) - 1);
    return {
      name: date.toLocaleString('default', { month: 'short' }),
      issues: item.count,
    };
  });

  const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];

  return (
    <div className="min-h-screen bg-muted/20 pb-12">
      {/* Header */}
      <div className="bg-gradient-amber text-slate-900 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-5xl font-bold font-display tracking-tight flex items-center gap-3 text-slate-900">
                <TrendingUp className="w-8 h-8 md:w-10 md:h-10 opacity-80" /> Project Infographics
              </h1>
              <p className="text-slate-300 mt-2 text-lg max-w-2xl font-sans">
                Real-time data visualization of the CivicPulse platform's impact and community engagement.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-slate-900/10 text-sm font-medium text-slate-900">
              <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
              Live System Status
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Total Citizens" value={data.users?.total || 0} icon={<Users className="w-5 h-5" />} trend="+4.2%" color="blue" />
          <StatCard title="Issues Reported" value={data.issues?.total || 0} icon={<FileText className="w-5 h-5" />} trend="+12.5%" color="amber" />
          <StatCard title="Resolution Rate" value={`${data.issues?.resolutionRate || 0}%`} icon={<CheckCircle className="w-5 h-5" />} trend="+2.1%" color="emerald" />
          <StatCard title="Community Satisfaction" value={data.feedback?.averageRating || 0} icon={<Activity className="w-5 h-5" />} subText="out of 5" color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Issue Status Distribution */}
          <Card className="shadow-premium border-border/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
              <div className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-primary" /> Issue Status Breakdown
                </CardTitle>
                <CardDescription>Current lifecycle distribution of all reported issues.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={issueStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {issueStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Trends */}
          <Card className="shadow-premium border-border/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
              <div className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" /> Reporting Trends
                </CardTitle>
                <CardDescription>Number of issues reported over the last 6 months.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorIssues" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="oklch(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="oklch(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Area type="monotone" dataKey="issues" stroke="oklch(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorIssues)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Category Breakdown */}
          <Card className="shadow-premium border-border/40 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
              <div className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" /> Issues by Category
                </CardTitle>
                <CardDescription>Top infrastructure concerns reported by the community.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 500 }} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="count" fill="oklch(var(--primary))" radius={[0, 4, 4, 0]} barSize={25} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* User Distribution */}
          <Card className="shadow-premium border-border/40 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
              <div className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" /> User Roles
                </CardTitle>
                <CardDescription>Distribution of active platform users.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {userData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, trend, subText, color }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
  };

  return (
    <Card className="border-border/40 shadow-sm hover:shadow-premium transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2.5 rounded-xl ${colorMap[color] || colorMap.blue} bg-opacity-10 dark:bg-opacity-20`}>
            {icon}
          </div>
          {trend && (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-950/30">
              {trend}
            </span>
          )}
        </div>
        <div className="space-y-1">
          <h3 className="text-3xl font-bold font-sans tracking-tight leading-none text-foreground">{value}</h3>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{title}</p>
          {subText && <p className="text-[10px] text-muted-foreground/60">{subText}</p>}
        </div>
      </CardContent>
    </Card>
  );
};

const AnalyticsLoading = () => (
  <div className="min-h-screen bg-muted/20 animate-pulse">
    <div className="h-48 bg-gradient-amber" />
    <div className="max-w-7xl mx-auto px-4 -mt-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 bg-card rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[1,2].map(i => <Skeleton key={i} className="h-[400px] bg-card rounded-xl" />)}
      </div>
    </div>
  </div>
);

const AnalyticsError = ({ retry }) => (
  <div className="min-h-screen flex items-center justify-center bg-muted/20">
    <div className="text-center space-y-4 bg-card p-10 rounded-2xl border shadow-xl max-w-md mx-auto">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      <h2 className="text-2xl font-bold text-foreground">Analytics Unavailable</h2>
      <p className="text-muted-foreground">We encountered an error while fetching the project statistics. Please check your connection or try again later.</p>
      <button 
        onClick={retry}
        className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
);

export default Analytics;
