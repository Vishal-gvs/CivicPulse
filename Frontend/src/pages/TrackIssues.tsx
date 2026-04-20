// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getIssues, updateIssue, parseIssuesFromResponse } from '../services/api';
import IssueCard from '../components/IssueCard';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, MapIcon, Compass } from 'lucide-react';
import { Link } from '@tanstack/react-router';

const TrackIssues = () => {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [filteredIssues, setFilteredIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: 'all', category: 'all', search: '' });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'sanitation', label: 'Sanitation' },
    { value: 'water', label: 'Water Supply' },
    { value: 'electricity', label: 'Electricity' },
    { value: 'roads', label: 'Roads & Transport' },
    { value: 'public-safety', label: 'Public Safety' },
    { value: 'environment', label: 'Environment' },
    { value: 'other', label: 'Other' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'open', label: 'Open' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' }
  ];

  const fetchIssues = useCallback(async () => {
    if (!user?._id || !user?.role) return;
    try {
      const response = await getIssues(user._id, user.role);
      setIssues(parseIssuesFromResponse(response));
    } catch (error) {
      console.error('Failed to fetch issues:', error);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, [user?._id, user?.role]);

  const applyFilters = () => {
    const issuesArray = Array.isArray(issues) ? issues : [];
    let filtered = [...issuesArray];

    if (filters.status !== 'all') {
      filtered = filtered.filter(issue => issue.status === filters.status);
    }
    if (filters.category !== 'all') {
      filtered = filtered.filter(issue => issue.category === filters.category);
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(issue => 
        issue.title?.toLowerCase().includes(searchLower) ||
        issue.description?.toLowerCase().includes(searchLower) ||
        issue.location?.toLowerCase().includes(searchLower)
      );
    }

    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setFilteredIssues(filtered);
  };

  useEffect(() => {
    if (user?._id) fetchIssues();
  }, [user?._id, fetchIssues]);

  useEffect(() => {
    applyFilters();
  }, [issues, filters]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const handleStatusUpdate = async (issueId, newStatus) => {
    try {
      await updateIssue(issueId, { status: newStatus });
      setIssues(prevIssues => prevIssues.map(issue => issue._id === issueId ? { ...issue, status: newStatus } : issue));
    } catch (error) {
      console.error('Failed to update issue status:', error);
    }
  };

  const stats = {
    total: Array.isArray(issues) ? issues.length : 0,
    open: Array.isArray(issues) ? issues.filter(i => i.status === 'open').length : 0,
    inProgress: Array.isArray(issues) ? issues.filter(i => i.status === 'in-progress').length : 0,
    resolved: Array.isArray(issues) ? issues.filter(i => i.status === 'resolved').length : 0
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">Loading issues...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-12">
      {/* Header */}
      <div className="bg-gradient-amber text-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold font-display mb-2 drop-shadow-sm flex items-center gap-3">
                <Compass className="w-8 h-8 opacity-80" /> Track Issues
              </h1>
              <p className="text-white/90 text-lg max-w-xl">
                {user?.role === 'citizen' && 'Monitor the progress of your reported issues and discover others in your community.'}
                {user?.role === 'authority' && 'Manage and resolve civic issues systematically.'}
                {user?.role === 'admin' && 'Oversee all civic requests and maintain system integrity.'}
              </p>
            </div>
            
            <div className="flex gap-4 md:gap-8 bg-black/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-lg">
              <div className="text-center px-1">
                <div className="text-3xl font-bold font-sans tracking-tight leading-none">{stats.total}</div>
                <div className="text-[10px] text-white/70 uppercase font-bold tracking-widest mt-2">Total Cases</div>
              </div>
              <div className="w-px bg-white/10"></div>
              <div className="text-center px-1">
                <div className="text-3xl font-bold font-sans tracking-tight leading-none text-amber-300">{stats.open}</div>
                <div className="text-[10px] text-white/70 uppercase font-bold tracking-widest mt-2">Open</div>
              </div>
              <div className="w-px bg-white/10"></div>
              <div className="text-center px-1">
                <div className="text-3xl font-bold font-sans tracking-tight leading-none text-blue-300">{stats.inProgress}</div>
                <div className="text-[10px] text-white/70 uppercase font-bold tracking-widest mt-2">Active</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        {/* Filters */}
        <Card className="p-5 md:p-7 mb-10 border-border/40 shadow-premium bg-card/80 backdrop-blur-xl rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-6 space-y-1.5">
              <Label className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search by title, description, or location..."
                  className="pl-9 bg-background/50 h-11"
                />
              </div>
            </div>

            <div className="md:col-span-3 space-y-1.5">
              <Label className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Status</Label>
              <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
                <SelectTrigger className="bg-background/50 h-11">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-3 space-y-1.5">
              <Label className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Category</Label>
              <Select value={filters.category} onValueChange={(v) => handleFilterChange('category', v)}>
                <SelectTrigger className="bg-background/50 h-11">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Results Info */}
        <div className="mb-6 flex justify-between items-center px-1">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
             Results <span className="bg-primary/10 text-primary py-0.5 px-2 rounded-full text-sm">{filteredIssues.length}</span>
          </h2>
          <div className="text-sm text-muted-foreground font-medium">Sorted by Newest</div>
        </div>

        {/* Grid */}
        {filteredIssues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIssues.map((issue) => (
              <IssueCard key={issue._id} issue={issue} userRole={user?.role} onStatusUpdate={handleStatusUpdate} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 px-4 bg-card rounded-2xl border border-border mt-4">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <MapIcon className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No Issues Found</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {issues.length === 0 ? "No issues have been reported in this community yet." : "No issues match your current filters."}
            </p>
            {issues.length > 0 && (
              <Button variant="outline" onClick={() => setFilters({ status: 'all', category: 'all', search: '' })}>
                Clear Filters
              </Button>
            )}
            {user?.role === 'citizen' && issues.length === 0 && (
              <Button asChild className="gap-2 ml-4">
                <Link to="/report-issue">Report First Issue</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackIssues;
