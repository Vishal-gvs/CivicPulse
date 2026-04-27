// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createFeedback, getFeedback, getIssues, parseIssuesFromResponse, likeFeedback, dislikeFeedback, starFeedback } from '../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Star as StarIcon, CheckCircle, SearchCode, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';

const Feedback = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [myIssues, setMyIssues] = useState([]);
  const [formData, setFormData] = useState({ message: '', category: 'general', rating: 5, issueId: 'none' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const categories = [
    { value: 'general', label: 'General Feedback' },
    { value: 'service-quality', label: 'Service Quality' },
    { value: 'issue-resolution', label: 'Issue Resolution' },
    { value: 'suggestion', label: 'Suggestion' },
    { value: 'complaint', label: 'Complaint' },
    { value: 'compliment', label: 'Compliment' }
  ];

  useEffect(() => {
    fetchFeedbacks();
    if (user?.role === 'citizen') {
      fetchMyIssues();
    }
  }, [user]);

  const fetchFeedbacks = async () => {
    try {
      const response = await getFeedback();
      setFeedbacks(response.data || []);
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error);
    }
  };

  const fetchMyIssues = async () => {
    try {
      if (!user?._id) return;
      const response = await getIssues(user._id, user.role);
      setMyIssues(parseIssuesFromResponse(response));
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (value) => {
    setFormData(prev => ({ ...prev, category: value }));
  };

  const handleIssueSelectChange = (value) => {
    setFormData(prev => ({ ...prev, issueId: value }));
  };

  const handleRatingChange = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.message) newErrors.message = 'Message is required';
    else if (formData.message.length < 10) newErrors.message = 'Message must be at least 10 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || !user?._id) return;
    
    setIsLoading(true);
    try {
      const feedbackData = { 
        ...formData, 
        userId: user._id, 
        userName: user.name,
        issueId: formData.issueId === 'none' ? undefined : formData.issueId
      };
      await createFeedback(feedbackData);
      setFormData({ message: '', category: 'general', rating: 5, issueId: 'none' });
      toast.success("Feedback submitted successfully!");
      fetchFeedbacks();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Failed to submit feedback. Please try again.';
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async (id) => {
    try {
      // Optimistic update
      setFeedbacks(prev => prev.map(f => {
        if (f._id === id) {
          const hasLiked = f.likes?.includes(user?._id);
          let newLikes = f.likes || [];
          let newDislikes = f.dislikes || [];
          
          if (hasLiked) {
            newLikes = newLikes.filter(uid => uid !== user?._id);
          } else {
            newLikes = [...newLikes, user?._id];
            newDislikes = newDislikes.filter(uid => uid !== user?._id);
          }
          return { ...f, likes: newLikes, dislikes: newDislikes };
        }
        return f;
      }));
      await likeFeedback(id);
      fetchFeedbacks(); // sync
    } catch (error) {
      toast.error("Failed to like feedback");
      fetchFeedbacks(); // revert
    }
  };

  const handleDislike = async (id) => {
    try {
      // Optimistic update
      setFeedbacks(prev => prev.map(f => {
        if (f._id === id) {
          const hasDisliked = f.dislikes?.includes(user?._id);
          let newLikes = f.likes || [];
          let newDislikes = f.dislikes || [];
          
          if (hasDisliked) {
            newDislikes = newDislikes.filter(uid => uid !== user?._id);
          } else {
            newDislikes = [...newDislikes, user?._id];
            newLikes = newLikes.filter(uid => uid !== user?._id);
          }
          return { ...f, likes: newLikes, dislikes: newDislikes };
        }
        return f;
      }));
      await dislikeFeedback(id);
      fetchFeedbacks(); // sync
    } catch (error) {
      toast.error("Failed to dislike feedback");
      fetchFeedbacks(); // revert
    }
  };

  const handleStar = async (id) => {
    try {
      // Optimistic update
      setFeedbacks(prev => prev.map(f => f._id === id ? { ...f, isStarred: !f.isStarred } : f));
      await starFeedback(id);
      toast.success("Feedback star updated");
      fetchFeedbacks();
    } catch (error) {
      toast.error("Failed to star feedback");
      fetchFeedbacks(); // revert
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const renderStars = (rating, interactive = false) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? "button" : "button"}
            onClick={interactive ? () => handleRatingChange(star) : undefined}
            disabled={!interactive}
            className={`transition-transform flex items-center justify-center p-1 ${interactive ? 'cursor-pointer hover:scale-110 active:scale-95' : 'cursor-default'}`}
          >
            <StarIcon
              className={`w-6 h-6 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
              strokeWidth={star <= rating ? 0 : 2}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-muted/20 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white mb-8 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-display tracking-tight">Feedback Board</h1>
              <p className="text-teal-100 font-medium mt-1">Share your experience, review others, and help us improve.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Feedback Form */}
          <div className="lg:col-span-1">
            <Card className="border-border shadow-card sticky top-24">
              <CardHeader>
                <CardTitle>Submit Feedback</CardTitle>
                <CardDescription>Tell us what you think.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label>Feedback Category</Label>
                    <Select value={formData.category} onValueChange={handleSelectChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {user?.role === 'citizen' && myIssues.length > 0 && (
                    <div className="space-y-2">
                      <Label>Link to Issue (Optional)</Label>
                      <Select value={formData.issueId} onValueChange={handleIssueSelectChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an issue to link" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">General Feedback (None)</SelectItem>
                          {myIssues.map(issue => (
                            <SelectItem key={issue._id} value={issue._id}>{issue.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <div className="pt-1">
                      {renderStars(formData.rating, true)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Your Message <span className="text-destructive">*</span></Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={4}
                      className={`resize-none ${errors.message ? 'border-destructive' : ''}`}
                      placeholder="Share your thoughts, suggestions..."
                    />
                    {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full font-semibold gap-2">
                    {isLoading ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Feedback List */}
          <div className="lg:col-span-2">
            <Card className="border-border shadow-sm p-6 md:p-8 bg-card h-full">
              <div className="mb-6 pb-4 border-b flex items-center justify-between">
                <h2 className="text-2xl font-bold font-display">Global Feedback Board</h2>
                <div className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-sm">
                  {feedbacks.length} Total
                </div>
              </div>
              
              {feedbacks.length > 0 ? (
                <div className="space-y-6">
                  {feedbacks.map((feedback) => (
                    <div key={feedback._id} className={`border ${feedback.isStarred ? 'border-yellow-400 bg-yellow-50/20' : 'border-border/50 bg-muted/10'} p-5 rounded-2xl hover:bg-muted/40 transition-colors group relative`}>
                      {feedback.isStarred && (
                        <div className="absolute -top-3 -right-3 bg-yellow-400 text-yellow-900 p-1.5 rounded-full shadow-lg">
                          <StarIcon className="w-5 h-5 fill-yellow-900" />
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/20 text-primary font-bold rounded-full flex items-center justify-center">
                            {feedback.user?.name?.charAt(0).toUpperCase() || feedback.userName?.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <h4 className="font-bold text-foreground leading-none">{feedback.user?.name || feedback.userName || 'Anonymous'}</h4>
                            <p className="text-xs font-medium text-muted-foreground mt-1">{formatDate(feedback.createdAt)}</p>
                            
                            {feedback.issue && (
                              <div className="mt-2 inline-flex items-center text-xs text-muted-foreground bg-primary/5 px-2 py-1 rounded border border-primary/10">
                                <span className="font-semibold mr-1">Linked Issue:</span> {feedback.issue.title}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="px-2.5 py-1 bg-background border text-foreground text-[10px] uppercase font-bold tracking-wider rounded-md">
                            {feedback.category?.replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mb-3 pl-13">
                        {renderStars(feedback.rating)}
                      </div>
                      
                      <p className="text-foreground/90 leading-relaxed text-sm sm:pl-13 p-3 rounded-lg border border-transparent">
                        "{feedback.message}"
                      </p>
                      
                      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/30 sm:pl-13">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleLike(feedback._id)} className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${feedback.likes?.includes(user?._id) ? 'text-blue-500' : 'text-muted-foreground hover:text-blue-500'}`}>
                            <ThumbsUp className={`w-4 h-4 ${feedback.likes?.includes(user?._id) ? 'fill-blue-500' : ''}`} />
                            <span>{feedback.likes?.length || 0}</span>
                          </button>
                          <button onClick={() => handleDislike(feedback._id)} className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${feedback.dislikes?.includes(user?._id) ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}>
                            <ThumbsDown className={`w-4 h-4 ${feedback.dislikes?.includes(user?._id) ? 'fill-red-500' : ''}`} />
                            <span>{feedback.dislikes?.length || 0}</span>
                          </button>
                        </div>
                        
                        {(user?.role === 'admin' || user?.role === 'manager') && (
                          <button onClick={() => handleStar(feedback._id)} className={`ml-auto flex items-center gap-1.5 text-sm font-medium transition-colors ${feedback.isStarred ? 'text-yellow-600' : 'text-muted-foreground hover:text-yellow-600'}`}>
                            <StarIcon className={`w-4 h-4 ${feedback.isStarred ? 'fill-yellow-500' : ''}`} />
                            <span>{feedback.isStarred ? 'Starred' : 'Star'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 px-4">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <SearchCode className="w-10 h-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">No Feedback Yet</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">Be the first to share your experience with the platform.</p>
                </div>
              )}
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Feedback;
