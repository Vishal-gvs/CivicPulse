// @ts-nocheck
import React, { useState } from 'react';
import { voteIssue, raiseResolveRequest, managerResolveIssue } from '../services/api';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ThumbsUp, Loader2, CheckCircle, Clock, MapPin, SendHorizonal, ShieldCheck, ShieldX, AlertTriangle, Activity } from 'lucide-react';
import { toast } from 'sonner';

const IssueCard = ({ issue, onStatusUpdate, userRole, showActions = true, currentUserId }) => {
  const [isVoting, setIsVoting] = useState(false);
  const [voted, setVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(
    typeof issue.votes === 'number' ? issue.votes : (issue.voteCount ?? (Array.isArray(issue.votes) ? issue.votes.length : 0))
  );
  const [isRequesting, setIsRequesting] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  // Local issue state for optimistic UI updates
  const [localIssue, setLocalIssue] = useState(issue);

  // ---- Helpers ----
  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800';
      case 'in-progress': return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800';
      case 'resolved': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <Clock className="w-3.5 h-3.5" />;
      case 'in-progress': return <Activity className="w-3.5 h-3.5 animate-pulse" />;
      case 'resolved': return <CheckCircle className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // ---- Manager resolve-request state helpers ----
  const getMyResolveRequest = () => {
    if (!currentUserId || !Array.isArray(localIssue.resolveRequests)) return null;
    return localIssue.resolveRequests.find(
      (r) => {
        const managerId = r.manager?._id || r.manager;
        return managerId?.toString() === currentUserId?.toString();
      }
    ) || null;
  };

  const myRequest = getMyResolveRequest();

  // ---- Handlers ----
  const handleVote = async () => {
    if (isVoting || voted) return;
    setIsVoting(true);
    try {
      await voteIssue(localIssue._id);
      setVoted(true);
      setVoteCount(prev => prev + 1);
      toast.success('Vote counted!');
    } catch (error) {
      toast.error('Failed to cast vote');
    } finally {
      setIsVoting(false);
    }
  };

  const handleStatusChange = (newStatus) => {
    if (onStatusUpdate) onStatusUpdate(localIssue._id, newStatus);
  };

  const handleRaiseRequest = async () => {
    setIsRequesting(true);
    try {
      const res = await raiseResolveRequest(localIssue._id);
      const updatedIssue = res.data?.data || localIssue;
      setLocalIssue(updatedIssue);
      toast.success('Resolve request raised! Waiting for admin approval.');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to raise resolve request';
      toast.error(msg);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleManagerResolve = async () => {
    setIsResolving(true);
    try {
      const res = await managerResolveIssue(localIssue._id);
      const updatedIssue = res.data?.data || { ...localIssue, status: 'resolved' };
      setLocalIssue(updatedIssue);
      if (onStatusUpdate) onStatusUpdate(localIssue._id, 'resolved');
      toast.success('Issue marked as resolved!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to resolve issue';
      toast.error(msg);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <Card className="hover:shadow-premium transition-all duration-500 flex flex-col h-full bg-card group border-border/60 overflow-hidden">
      <CardHeader className="pb-4 pt-5 px-6 border-b border-border/40 bg-muted/5">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 space-y-1">
            <h3 className="text-lg font-bold text-card-foreground leading-snug group-hover:text-primary transition-colors duration-300">
              {localIssue.title}
            </h3>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
              <span className="text-primary/90">{localIssue.category}</span>
              <span className="w-1 h-1 bg-muted-foreground/30 rounded-full"></span>
              <span>{formatDate(localIssue.createdAt)}</span>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-extrabold uppercase tracking-widest shadow-sm ${getStatusColor(localIssue.status)}`}>
            {getStatusIcon(localIssue.status)}
            <span>{localIssue.status?.replace('-', ' ')}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 flex-grow">
        <p className="text-sm text-foreground/80 leading-relaxed mb-4 line-clamp-3">
          {localIssue.description}
        </p>

        {localIssue.location && (
          <div className="flex items-center space-x-1.5 text-sm text-muted-foreground mb-4">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="truncate">{localIssue.location}</span>
          </div>
        )}

        {localIssue.image && (
          <div className="rounded-lg overflow-hidden border">
            <img src={localIssue.image} alt={localIssue.title} className="w-full h-40 object-cover hover:scale-105 transition-transform duration-500" />
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 pb-4 px-6 flex-col items-stretch gap-3">
        <div className="flex justify-between items-center w-full">
          <Button
            variant={voted ? "secondary" : "outline"}
            size="sm"
            onClick={handleVote}
            disabled={isVoting || voted}
            className={`h-8 gap-1.5 font-bold rounded-full ${voted ? 'text-green-600 bg-green-50 border-green-200' : ''}`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>{isVoting ? 'Voting...' : voted ? 'Voted' : 'Vote'}</span>
            <span className="opacity-70">({voteCount})</span>
          </Button>

          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <div className="w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">
                {localIssue.reportedBy?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="font-medium truncate max-w-[100px]">{localIssue.reportedBy?.name}</span>
          </div>
        </div>

        {/* MANAGER ACTIONS */}
        {showActions && userRole === 'manager' && localIssue.status !== 'resolved' && (
          <div className="mt-2 pt-3 border-t space-y-2">
            {/* Direct Status Controls (Previously Authority) */}
            <div className="flex items-center gap-2 mb-2">
              {localIssue.status === 'open' && (
                <Button size="sm" variant="outline" className="w-full h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50" onClick={() => handleStatusChange('in-progress')}>
                  <Activity className="w-3.5 h-3.5 mr-1.5" /> Start Work
                </Button>
              )}
              {localIssue.status === 'in-progress' && (
                <div className="text-xs font-bold text-indigo-600 bg-indigo-50/50 px-2 py-1 rounded border border-indigo-100 flex items-center gap-1.5 w-full justify-center">
                  <Activity className="w-3 h-3 animate-pulse" /> Issue is in progress
                </div>
              )}
            </div>

            {/* Resolve Request Logic (Specific to Manager/Community flow) */}
            {!myRequest && (
              <Button
                size="sm"
                variant="outline"
                className="w-full h-9 gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                onClick={handleRaiseRequest}
                disabled={isRequesting}
              >
                <SendHorizonal className="w-4 h-4" />
                {isRequesting ? 'Sending Request...' : 'Request to Resolve'}
              </Button>
            )}

            {myRequest?.status === 'pending' && (
              <div className="flex items-center gap-2 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>Resolve request pending admin approval</span>
              </div>
            )}

            {myRequest?.status === 'approved' && (
              <Button
                size="sm"
                className="w-full h-9 gap-2 bg-green-600 hover:bg-green-700 text-white font-bold"
                onClick={handleManagerResolve}
                disabled={isResolving}
              >
                <ShieldCheck className="w-4 h-4" />
                {isResolving ? 'Resolving...' : 'Mark as Resolved'}
              </Button>
            )}

            {myRequest?.status === 'rejected' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <ShieldX className="w-4 h-4 flex-shrink-0" />
                  <span>Request rejected by admin</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-8 gap-2 border-blue-300 text-blue-700 hover:bg-blue-50 text-xs"
                  onClick={handleRaiseRequest}
                  disabled={isRequesting}
                >
                  <SendHorizonal className="w-3.5 h-3.5" />
                  Re-request Resolution
                </Button>
              </div>
            )}
          </div>
        )}



        {/* ADMIN ACTIONS */}
        {showActions && userRole === 'admin' && (
          <div className="mt-2 pt-3 border-t">
            <select
              value={localIssue.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full h-8 px-2 text-sm font-medium border rounded-md bg-background focus:ring-1 focus:ring-primary"
            >
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default IssueCard;
