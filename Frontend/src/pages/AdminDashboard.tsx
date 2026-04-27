// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getUsers,
  getIssues,
  getAnalytics,
  getPendingManagers,
  approveManager,
  rejectManager,
  getPendingResolveRequests,
  approveResolveRequest,
  rejectResolveRequest,
  parseIssuesFromResponse,
  parseUsersListResponse,
  parsePendingManagersResponse,
  parsePendingResolveRequestsResponse,
  parseAnalyticsResponse
} from '../services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, Users as UsersIcon, ShieldCheck, ListTodo, FileBarChart, CheckCircle, XCircle, Loader2, Briefcase, SendHorizonal } from 'lucide-react';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [issues, setIssues] = useState([]);
  const [, setAnalytics] = useState(null);
  const [pendingManagers, setPendingManagers] = useState([]);
  const [pendingResolveRequests, setPendingResolveRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?._id) fetchData();
  }, [user?._id]);

  const fetchData = async () => {
    if (!user?._id || !user?.role) {
      setLoading(false); return;
    }
    try {
      const [usersRes, issuesRes, analyticsRes, managersRes, resolveReqRes] = await Promise.all([
        getUsers(), getIssues(user._id, user.role), getAnalytics(user._id, user.role),
        getPendingManagers(), getPendingResolveRequests()
      ]);
      setUsers(parseUsersListResponse(usersRes));
      setIssues(parseIssuesFromResponse(issuesRes));
      setAnalytics(parseAnalyticsResponse(analyticsRes));
      setPendingManagers(parsePendingManagersResponse(managersRes));
      setPendingResolveRequests(parsePendingResolveRequestsResponse(resolveReqRes));
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
      toast.error("Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  };



  const handleApproveManager = async (userId) => {
    try {
      await approveManager(userId);
      setPendingManagers(prev => prev.filter(m => m._id !== userId));
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: 'active' } : u));
      toast.success("Manager approved successfully.");
    } catch (error) {
      toast.error("Failed to approve manager.");
    }
  };

  const handleRejectManager = async (userId) => {
    try {
      await rejectManager(userId);
      setPendingManagers(prev => prev.filter(m => m._id !== userId));
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: 'rejected' } : u));
      toast.success("Manager rejected.");
    } catch (error) {
      toast.error("Failed to reject manager.");
    }
  };

  const handleApproveResolveRequest = async (issueId, reqId) => {
    try {
      await approveResolveRequest(issueId, reqId);
      setPendingResolveRequests(prev => prev.filter(r => r.requestId !== reqId));
      toast.success("Resolve request approved! Manager can now resolve the issue.");
    } catch (error) {
      toast.error("Failed to approve resolve request.");
    }
  };

  const handleRejectResolveRequest = async (issueId, reqId) => {
    try {
      await rejectResolveRequest(issueId, reqId);
      setPendingResolveRequests(prev => prev.filter(r => r.requestId !== reqId));
      toast.success("Resolve request rejected.");
    } catch (error) {
      toast.error("Failed to reject resolve request.");
    }
  };

  const getRoleStats = () => {
    const stats = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {});
    return { 
      total: users.length, 
      citizens: stats.citizen || 0, 
      managers: stats.manager || 0,
      admins: stats.admin || 0 
    };
  };

  const getIssueStats = () => {
    return issues.reduce((acc, issue) => {
      acc.total++;
      if (issue.status === 'open') acc.open++;
      if (issue.status === 'in-progress') acc.inProgress++;
      if (issue.status === 'resolved') acc.resolved++;
      return acc;
    }, { total: 0, open: 0, inProgress: 0, resolved: 0 });
  };

  const getCategoryStats = () => {
    const stats = issues.reduce((acc, issue) => { acc[issue.category] = (acc[issue.category] || 0) + 1; return acc; }, {});
    return Object.entries(stats).map(([category, count]) => ({
      category, count, percentage: issues.length ? ((count / issues.length) * 100).toFixed(1) : '0.0'
    })).sort((a, b) => b.count - a.count);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Loading admin workspace...</p>
        </div>
      </div>
    );
  }

  const userStats = getRoleStats();
  const issueStats = getIssueStats();
  const categoryStats = getCategoryStats();

  return (
    <div className="min-h-screen bg-muted/20 pb-12">
      {/* Header */}
      <div className="bg-slate-900 text-white border-b border-primary/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className="bg-primary/20 p-3 rounded-2xl border border-primary/30 text-primary">
                 <ShieldCheck className="h-8 w-8" />
               </div>
               <div>
                  <h1 className="text-3xl md:text-4xl font-bold font-display leading-tight text-slate-300">Admin Dashboard</h1>
                  <p className="text-slate-300 font-medium">System administration and global analytics</p>
               </div>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-800/50 p-2 pr-4 rounded-xl border border-slate-700/50 self-start md:self-auto">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-white shadow-inner">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="block text-sm font-bold text-white leading-none">{user?.name}</span>
                <span className="block text-xs text-primary mt-1 uppercase font-bold tracking-wider">Administrator</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <div className="bg-card px-2 py-2 rounded-xl shadow-sm border border-border inline-block min-w-full md:min-w-0 overflow-x-auto">
            <TabsList className="bg-transparent h-auto p-0 flex flex-nowrap w-max">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-5 py-2.5 rounded-lg flex gap-2"><LayoutDashboard className="h-4 w-4" /> Overview</TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-5 py-2.5 rounded-lg flex gap-2"><UsersIcon className="h-4 w-4" /> Users</TabsTrigger>
              <TabsTrigger value="approvals" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-5 py-2.5 rounded-lg flex gap-2 relative">
                <Briefcase className="h-4 w-4" /> Approvals
                {pendingManagers.length > 0 && <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>}
              </TabsTrigger>
              <TabsTrigger value="resolve-requests" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-5 py-2.5 rounded-lg flex gap-2 relative">
                <SendHorizonal className="h-4 w-4" /> Resolve Requests
                {pendingResolveRequests.length > 0 && <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>}
              </TabsTrigger>
              <TabsTrigger value="issues" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-5 py-2.5 rounded-lg flex gap-2"><ListTodo className="h-4 w-4" /> Issues</TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary px-5 py-2.5 rounded-lg flex gap-2"><FileBarChart className="h-4 w-4" /> Analytics</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-6 animate-fade-in outline-none">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Users</p>
                  <h3 className="text-3xl font-bold">{userStats.total}</h3>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total Issues</p>
                  <h3 className="text-3xl font-bold">{issueStats.total}</h3>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Resolved Issues</p>
                  <h3 className="text-3xl font-bold text-green-600">{issueStats.resolved}</h3>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Resolution Rate</p>
                  <h3 className="text-3xl font-bold text-primary">
                    {issueStats.total > 0 ? Math.round((issueStats.resolved / issueStats.total) * 100) : 0}%
                  </h3>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-lg">User Distribution</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30 group hover:bg-blue-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                      <span className="font-bold text-sm tracking-tight text-slate-700 dark:text-slate-300">Citizens</span>
                    </div>
                    <span className="font-mono font-bold text-2xl text-blue-700 dark:text-blue-400">{userStats.citizens}</span>
                  </div>

                  <div className="flex justify-between items-center bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-900/30 group hover:bg-indigo-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                      <span className="font-bold text-sm tracking-tight text-slate-700 dark:text-slate-300">Managers</span>
                    </div>
                    <span className="font-mono font-bold text-2xl text-indigo-700 dark:text-indigo-400">{userStats.managers}</span>
                  </div>
                  <div className="flex justify-between items-center bg-purple-50/50 p-4 rounded-xl border border-purple-100 dark:bg-purple-900/10 dark:border-purple-900/30 group hover:bg-purple-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 bg-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                      <span className="font-bold text-sm tracking-tight text-slate-700 dark:text-slate-300">Admins</span>
                    </div>
                    <span className="font-mono font-bold text-2xl text-purple-700 dark:text-purple-400">{userStats.admins}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-lg">Issue Categories Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-5">
                  {categoryStats.length > 0 ? categoryStats.slice(0, 5).map((cat) => (
                    <div key={cat.category} className="space-y-2">
                       <div className="flex justify-between text-sm font-semibold">
                         <span className="capitalize">{cat.category?.replace('-', ' ')}</span>
                         <span className="text-muted-foreground">{cat.count} ({cat.percentage}%)</span>
                       </div>
                       <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${cat.percentage}%` }} />
                       </div>
                    </div>
                  )) : (
                    <p className="text-muted-foreground text-center py-6">No data available.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>



          {/* Managers Approval Tab */}
          <TabsContent value="approvals" className="animate-fade-in outline-none">
            <Card>
              <CardHeader className="border-b bg-muted/20">
                <CardTitle>Pending Managers</CardTitle>
                <CardDescription>Approve managers before they can view and handle issues.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {pendingManagers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="font-semibold text-muted-foreground">No pending manager approvals.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-muted/50 border-b text-muted-foreground text-xs uppercase font-bold tracking-wider">
                          <th className="p-4">Name</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Applied</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {pendingManagers.map(mgr => (
                          <tr key={mgr._id} className="hover:bg-muted/30 transition-colors">
                            <td className="p-4 font-semibold">{mgr.name}</td>
                            <td className="p-4 text-muted-foreground text-sm">{mgr.email}</td>
                            <td className="p-4 text-muted-foreground text-sm">{new Date(mgr.createdAt).toLocaleDateString()}</td>
                            <td className="p-4 text-right space-x-2">
                              <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50 border-green-200 gap-1" onClick={() => handleApproveManager(mgr._id)}>
                                <CheckCircle className="h-4 w-4" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 border-red-200 gap-1" onClick={() => handleRejectManager(mgr._id)}>
                                <XCircle className="h-4 w-4" /> Reject
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resolve Requests Tab */}
          <TabsContent value="resolve-requests" className="animate-fade-in outline-none">
            <Card>
              <CardHeader className="border-b bg-muted/20">
                <CardTitle>Pending Resolve Requests</CardTitle>
                <CardDescription>Managers are requesting permission to resolve these issues. Approve to grant them access.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {pendingResolveRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <p className="font-semibold text-muted-foreground">No pending resolve requests.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-muted/50 border-b text-muted-foreground text-xs uppercase font-bold tracking-wider">
                          <th className="p-4 min-w-[200px]">Issue</th>
                          <th className="p-4">Manager</th>
                          <th className="p-4">Note</th>
                          <th className="p-4">Requested</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {pendingResolveRequests.map(req => (
                          <tr key={req.requestId} className="hover:bg-muted/30 transition-colors">
                            <td className="p-4">
                              <p className="font-bold text-sm text-foreground">{req.issue?.title}</p>
                              <p className="text-xs text-muted-foreground capitalize">{req.issue?.category} · {req.issue?.status}</p>
                            </td>
                            <td className="p-4">
                              <p className="font-semibold text-sm">{req.manager?.name}</p>
                              <p className="text-xs text-muted-foreground">{req.manager?.email}</p>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground max-w-[160px]">
                              <span className="line-clamp-2">{req.note || '—'}</span>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground whitespace-nowrap">
                              {new Date(req.requestedAt).toLocaleDateString()}
                            </td>
                            <td className="p-4 text-right space-x-2 whitespace-nowrap">
                              <Button size="sm" variant="outline" className="text-green-600 hover:bg-green-50 border-green-200 gap-1" onClick={() => handleApproveResolveRequest(req.issue._id, req.requestId)}>
                                <CheckCircle className="h-4 w-4" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 border-red-200 gap-1" onClick={() => handleRejectResolveRequest(req.issue._id, req.requestId)}>
                                <XCircle className="h-4 w-4" /> Reject
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="animate-fade-in outline-none">
             <Card>
               <CardHeader className="border-b bg-muted/20">
                 <CardTitle>User Directory</CardTitle>
               </CardHeader>
               <CardContent className="p-0">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-muted/50 border-b text-muted-foreground text-xs uppercase font-bold tracking-wider">
                          <th className="p-4">User</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Role</th>
                          <th className="p-4 text-right">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                         {users.map(u => (
                           <tr key={u._id} className="hover:bg-muted/30 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                                    {u.name?.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="font-semibold text-sm">{u.name}</span>
                                </div>
                              </td>
                              <td className="p-4 text-muted-foreground text-sm">{u.email}</td>
                              <td className="p-4">
                                <Badge variant={u.role === 'admin' ? "destructive" : "secondary"} className="uppercase text-[10px] tracking-wider">
                                  {u.role}
                                </Badge>
                              </td>
                              <td className="p-4 text-right text-muted-foreground text-sm">
                                {new Date(u.createdAt).toLocaleDateString()}
                              </td>
                           </tr>
                         ))}
                      </tbody>
                    </table>
                 </div>
               </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="issues" className="animate-fade-in outline-none">
             <Card>
               <CardHeader className="border-b bg-muted/20">
                 <CardTitle>Global Issue Feed</CardTitle>
               </CardHeader>
               <CardContent className="p-0">
                 <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-muted/50 border-b text-muted-foreground text-xs uppercase font-bold tracking-wider">
                          <th className="p-4 min-w-[200px]">Issue Details</th>
                          <th className="p-4">Category</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                         {issues.map(i => (
                           <tr key={i._id} className="hover:bg-muted/30 transition-colors">
                              <td className="p-4">
                                 <p className="font-bold text-sm leading-tight text-foreground mb-1">{i.title}</p>
                                 <p className="text-xs text-muted-foreground line-clamp-1">{i.location || 'No location'}</p>
                              </td>
                              <td className="p-4">
                                 <span className="text-xs font-semibold px-2 py-1 bg-muted rounded-md">{i.category}</span>
                              </td>
                              <td className="p-4">
                                 <Badge variant={i.status === 'resolved' ? "default" : i.status === 'in-progress' ? "secondary" : "outline"} className={`capitalize text-[10px] ${i.status === 'resolved' ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100' : ''}`}>
                                   {i.status?.replace('-', ' ')}
                                 </Badge>
                              </td>
                              <td className="p-4 text-right text-muted-foreground text-sm">{new Date(i.createdAt).toLocaleDateString()}</td>
                           </tr>
                         ))}
                      </tbody>
                    </table>
                 </div>
               </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="analytics" className="animate-fade-in outline-none">
             <Card className="border-dashed shadow-none bg-muted/10 text-center py-20">
               <CardContent>
                 <FileBarChart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                 <h2 className="text-2xl font-bold mb-2">Advanced Analytics</h2>
                 <p className="text-muted-foreground max-w-md mx-auto">Detailed historical reporting and analytics engine will be available in the next platform update.</p>
               </CardContent>
             </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
