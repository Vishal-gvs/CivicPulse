// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useRouterState, useNavigate } from '@tanstack/react-router';
import { useAuth } from '../context/AuthContext';
import { getIssues, parseIssuesFromResponse } from '../services/api';
import IssueCard from '../components/IssueCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, PlusCircle, LayoutList, MessageSquare, BarChart, Users, CheckCircle, ShieldAlert, Briefcase, SendHorizonal, Activity, Clock, ShieldCheck } from 'lucide-react';

const Dashboard = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const routerState = useRouterState();
  const navigate = useNavigate();
  const location = routerState.location;
  
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });

  const fetchIssues = useCallback(async () => {
    if (!user?._id || !user?.role) return;
    try {
      const response = await getIssues(user._id, user.role);
      const issuesData = parseIssuesFromResponse(response);
      setIssues(issuesData);
      
      const newStats = issuesData.reduce((acc, issue) => {
        acc.total++;
        switch (issue.status) {
          case 'open': acc.open++; break;
          case 'in-progress': acc.inProgress++; break;
          case 'resolved': acc.resolved++; break;
          default: break;
        }
        return acc;
      }, { total: 0, open: 0, inProgress: 0, resolved: 0 });
      setStats(newStats);
    } catch (error) {
      console.error('Failed to fetch issues:', error);
      setIssues([]);
      setStats({ total: 0, open: 0, inProgress: 0, resolved: 0 });
    } finally {
      setLoading(false);
    }
  }, [user?._id, user?.role]);

  useEffect(() => {
    if (user?._id && user?.role) {
      fetchIssues();
    }
  }, [user?._id, user?.role, fetchIssues]);

  useEffect(() => {
    const handleFocus = () => {
      if (user?._id) fetchIssues();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user?._id, fetchIssues]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md w-full border-border shadow-card p-8 text-center space-y-6">
          <ShieldAlert className="w-16 h-16 mx-auto text-destructive" />
          <h2 className="text-2xl font-bold font-display">Access Denied</h2>
          <p className="text-muted-foreground">Please login to access your dashboard</p>
          <Button asChild size="lg" className="w-full">
            <Link to="/login">Go to Login</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const handleStatusUpdate = async (issueId, newStatus) => {
    try {
      setIssues(prevIssues => prevIssues.map(issue => issue._id === issueId ? { ...issue, status: newStatus } : issue));
      await fetchIssues();
    } catch (error) {
      console.error('Failed to update issue status:', error);
      await fetchIssues();
    }
  };

  const getRecentIssues = () => {
    if (!Array.isArray(issues)) return [];
    return issues.filter(issue => issue && typeof issue === 'object')
      .sort((a, b) => (b?.createdAt ? new Date(b.createdAt) : new Date(0)) - (a?.createdAt ? new Date(a.createdAt) : new Date(0)))
      .slice(0, 6);
  };

  const getDashboardContent = () => {
    const recent = getRecentIssues();
    switch (user?.role) {
      case 'citizen': return <CitizenDashboard issues={recent} stats={stats} userRole={user?.role} />;
      case 'manager': return <ManagerDashboard issues={recent} stats={stats} onStatusUpdate={handleStatusUpdate} currentUserId={user?._id} />;
      case 'admin': return <AdminDashboard issues={recent} stats={stats} onStatusUpdate={handleStatusUpdate} />;
      default: return <div>Invalid user role</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
         <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header section with gradient */}
      <div className="bg-gradient-amber text-slate-900 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-display mb-2 drop-shadow-sm text-slate-900">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-slate-300 text-slate-300">
                {user?.role === 'citizen' && 'Track and manage your civic issues'}
                {user?.role === 'manager' && 'Manage and resolve community issues'}
                {user?.role === 'admin' && 'Manage the entire system'}
              </p>
            </div>
            <div className="text-left md:text-right">
              <div className="text-sm text-slate-700 mb-1">Current Role</div>
              <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-md rounded-lg border border-slate-900/10">
                <span className="font-bold tracking-wide uppercase text-sm text-slate-900">{user?.role}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {getDashboardContent()}
      </div>
    </div>
  );
};

// Citizen Dashboard
const CitizenDashboard = ({ issues, stats, userRole }) => {
  const safeIssues = Array.isArray(issues) ? issues : [];
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-foreground font-sans">
        <StatCard title="Total Issues" value={stats.total} icon={<BarChart className="w-6 h-6 text-primary" />} />
        <StatCard title="Open" value={stats.open} icon={<Activity className="w-6 h-6 text-red-500" />} />
        <StatCard title="In Progress" value={stats.inProgress} icon={<Loader2 className="w-6 h-6 text-blue-500 animate-spin-slow" />} />
        <StatCard title="Resolved" value={stats.resolved} icon={<CheckCircle className="w-6 h-6 text-green-500" />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActionCard title="Report New Issue" description="Report a new civic issue in your area" icon={<PlusCircle className="w-8 h-8 text-primary" />} to="/report-issue" />
        <ActionCard title="Track Issues" description="View status of all reported issues" icon={<LayoutList className="w-8 h-8 text-secondary-foreground" />} to="/track-issues" />
        <ActionCard title="Give Feedback" description="Provide feedback on resolved issues" icon={<MessageSquare className="w-8 h-8 text-green-600" />} to="/feedback" />
      </div>

      <div className="bg-card rounded-2xl shadow-card border border-border p-6 md:p-8">
        <div className="flex justify-between items-end mb-6 border-b pb-4">
          <div>
             <h2 className="text-2xl font-bold font-display">Your Recent Issues</h2>
             <p className="text-sm text-muted-foreground mt-1">Issues you recently reported</p>
          </div>
          <Button asChild variant="ghost" className="text-primary hover:text-primary/80 font-semibold gap-1">
            <Link to="/track-issues">View All <span aria-hidden="true">→</span></Link>
          </Button>
        </div>
        
        {safeIssues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeIssues.map((issue) => (
              <IssueCard key={issue._id || issue.id} issue={issue} userRole={userRole || 'citizen'} showActions={false} />
            ))}
          </div>
        ) : (
          <EmptyState title="No Issues Found" description="You haven't reported any issues yet." actionText="Report New Issue" actionTo="/report-issue" />
        )}
      </div>
    </div>
  );
};

// Manager Dashboard
const ManagerDashboard = ({ issues, stats, onStatusUpdate, currentUserId }) => {
  const safeIssues = Array.isArray(issues) ? issues : [];
  
  // Count my pending resolve requests across all visible issues
  const myPendingRequests = safeIssues.reduce((count, issue) => {
    if (!Array.isArray(issue.resolveRequests)) return count;
    const hasPending = issue.resolveRequests.some(
      (r) => (r.manager?._id || r.manager)?.toString() === currentUserId?.toString() && r.status === 'pending'
    );
    return hasPending ? count + 1 : count;
  }, 0);

  const myApprovedRequests = safeIssues.reduce((count, issue) => {
    if (!Array.isArray(issue.resolveRequests)) return count;
    const hasApproved = issue.resolveRequests.some(
      (r) => (r.manager?._id || r.manager)?.toString() === currentUserId?.toString() && r.status === 'approved'
    );
    return hasApproved ? count + 1 : count;
  }, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-foreground font-sans">
        <StatCard title="Total Issues" value={stats.total} icon={<BarChart className="w-6 h-6 text-primary" />} />
        <StatCard title="Pending" value={stats.open} icon={<Clock className="w-6 h-6 text-red-500" />} />
        <StatCard title="My Pending Requests" value={myPendingRequests} icon={<Clock className="w-6 h-6 text-orange-500" />} />
        <StatCard title="Ready to Resolve" value={myApprovedRequests} icon={<ShieldCheck className="w-6 h-6 text-green-500" />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ActionCard title="Browse All Issues" description="View and manage all community issues" icon={<LayoutList className="w-8 h-8 text-primary" />} to="/track-issues" />
        <ActionCard title="Give Feedback" description="Share your experience" icon={<MessageSquare className="w-8 h-8 text-green-600" />} to="/feedback" />
      </div>

      <div className="bg-card rounded-2xl shadow-card border border-border p-6 md:p-8">
        <div className="flex justify-between items-end mb-6 border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold font-display flex items-center gap-2">
              <Briefcase className="w-6 h-6 text-primary" /> Issues to Handle
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Review and manage community issues</p>
          </div>
          <Button asChild variant="ghost" className="text-primary hover:text-primary/80 font-semibold gap-1">
            <Link to="/track-issues">View All <span aria-hidden="true">→</span></Link>
          </Button>
        </div>
        
        {safeIssues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeIssues.map((issue) => (
              <IssueCard key={issue._id} issue={issue} userRole="manager" onStatusUpdate={onStatusUpdate} currentUserId={currentUserId} showActions={issue.status !== 'resolved'} />
            ))}
          </div>
        ) : (
          <EmptyState title="No Issues Available" description="No civic issues are available right now." actionText="Browse All Issues" actionTo="/track-issues" />
        )}
      </div>
    </div>
  );
};



// Admin Dashboard
const AdminDashboard = ({ issues, stats, onStatusUpdate }) => {
  const safeIssues = Array.isArray(issues) ? issues : [];
  
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-foreground font-sans">
        <StatCard title="Total Issues" value={stats.total} icon={<BarChart className="w-6 h-6 text-primary" />} />
        <StatCard title="Open" value={stats.open} icon={<Activity className="w-6 h-6 text-red-500" />} />
        <StatCard title="In Progress" value={stats.inProgress} icon={<Loader2 className="w-6 h-6 text-blue-500 animate-spin-slow" />} />
        <StatCard title="Resolved" value={stats.resolved} icon={<CheckCircle className="w-6 h-6 text-green-500" />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <ActionCard title="Manage Issues" description="View and manage all issues" icon={<LayoutList className="w-8 h-8 text-primary" />} to="/track-issues" />
         <ActionCard title="Manage Users" description="Manage system users and roles" icon={<Users className="w-8 h-8 text-purple-600" />} to="/admin" />
         <ActionCard title="System Analytics" description="View system-wide analytics" icon={<BarChart className="w-8 h-8 text-green-600" />} to="/analytics" />
      </div>

      <div className="bg-card rounded-2xl shadow-card border border-border p-6 md:p-8">
        <div className="flex justify-between items-end mb-6 border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold font-display">Recent Issues</h2>
            <p className="text-sm text-muted-foreground mt-1">Latest issues in the system</p>
          </div>
          <Button asChild variant="ghost" className="text-primary hover:text-primary/80 font-semibold gap-1">
            <Link to="/track-issues">View All <span aria-hidden="true">→</span></Link>
          </Button>
        </div>
        
        {safeIssues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safeIssues.map((issue) => (
              <IssueCard key={issue._id} issue={issue} userRole="admin" onStatusUpdate={onStatusUpdate} />
            ))}
          </div>
        ) : (
          <EmptyState title="No issues in system" description="No civic issues have been reported yet" />
        )}
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ title, value, icon }) => (
  <Card className="border-border shadow-sm hover:shadow-premium transition-all duration-300 group overflow-hidden">
    <CardContent className="p-6">
       <div className="flex items-center justify-between">
         <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none">{title}</p>
            <h3 className="text-3xl font-bold font-sans text-foreground leading-none">{value}</h3>
         </div>
         <div className="w-12 h-12 bg-muted/50 rounded-2xl flex items-center justify-center group-hover:bg-primary/5 group-hover:scale-110 transition-all duration-300 border border-border/50">
           {icon}
         </div>
       </div>
    </CardContent>
  </Card>
);

const ActionCard = ({ title, description, icon, to }) => (
  <Card className="hover:shadow-card-hover hover:border-primary/50 transition-all duration-300 group">
    <Link to={to} className="block p-6 h-full">
      <div className="flex items-start space-x-4">
        <div className="p-3 bg-muted group-hover:bg-primary/10 rounded-xl transition-colors">
          {icon}
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground mb-1.5 group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </Link>
  </Card>
);

const EmptyState = ({ title, description, actionText, actionTo }) => (
  <div className="text-center py-16 px-4">
    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
      <CheckCircle className="w-10 h-10 text-muted-foreground/50" />
    </div>
    <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">{description}</p>
    {actionText && actionTo && (
      <Button asChild size="lg">
        <Link to={actionTo}>{actionText}</Link>
      </Button>
    )}
  </div>
);

export default Dashboard;
