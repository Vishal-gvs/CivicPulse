// @ts-nocheck
import React, { useState, useRef } from 'react';
import { useNavigate, useRouter } from '@tanstack/react-router';
import { useAuth } from '../context/AuthContext';
import { createIssue } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, FileImage, X, UploadCloud } from 'lucide-react';
import { toast } from 'sonner';

const ReportIssue = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'infrastructure',
    location: '',
    image: null
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const categories = [
    { value: 'infrastructure', label: 'Infrastructure', icon: '🏗️' },
    { value: 'sanitation', label: 'Sanitation', icon: '🧹' },
    { value: 'water', label: 'Water Supply', icon: '💧' },
    { value: 'electricity', label: 'Electricity', icon: '⚡' },
    { value: 'roads', label: 'Roads & Transport', icon: '🚗' },
    { value: 'public-safety', label: 'Public Safety', icon: '🚨' },
    { value: 'environment', label: 'Environment', icon: '🌳' },
    { value: 'other', label: 'Other', icon: '📝' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, image: 'Please select an image file' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'Image size should be less than 5MB' }));
        return;
      }
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onload = (ev) => { setPreviewImage(ev.target.result); };
      reader.readAsDataURL(file);
      if (errors.image) setErrors(prev => ({ ...prev, image: '' }));
    }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    setPreviewImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title) newErrors.title = 'Title is required';
    else if (formData.title.length < 5) newErrors.title = 'Title must be at least 5 characters';
    
    if (!formData.description) newErrors.description = 'Description is required';
    else if (formData.description.length < 20) newErrors.description = 'Description must be at least 20 characters';
    
    if (!formData.location) newErrors.location = 'Location is required';
    else if (formData.location.length < 3) newErrors.location = 'Location must be at least 3 characters';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('location', formData.location);
      formDataToSend.append('reportedBy', user._id);
      if (formData.image) formDataToSend.append('image', formData.image);
      
      const response = await createIssue(formDataToSend);
      if (response.data) {
        toast.success("Issue reported successfully!");
        navigate({ to: '/dashboard', state: { message: 'Issue reported successfully!', type: 'success' } });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to report issue. Please try again.';
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white mb-8 border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
              <FileImage className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold font-display tracking-tight">Report New Issue</h1>
              <p className="text-blue-100 font-medium mt-1">Help improve your community by reporting civic issues</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="border-border shadow-card backdrop-blur-sm bg-card/95">
          <CardHeader>
            <CardTitle>Issue Details</CardTitle>
            <CardDescription>Provide accurate information so authorities can act quickly.</CardDescription>
          </CardHeader>
          <CardContent>
            {errors.general && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Category */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Category <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {categories.map((category) => (
                    <label
                      key={category.value}
                      className={`relative flex flex-col items-center p-4 border rounded-xl cursor-pointer transition-all ${
                        formData.category === category.value
                          ? 'border-primary bg-primary/5 shadow-sm text-primary ring-1 ring-primary'
                          : 'border-border hover:bg-muted text-foreground/80'
                      }`}
                    >
                      <input
                        type="radio"
                        name="category"
                        value={category.value}
                        checked={formData.category === category.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <span className="text-3xl mb-3 block transform hover:scale-110 transition-transform">{category.icon}</span>
                      <span className="text-xs font-semibold text-center">{category.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Title & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Issue Title <span className="text-destructive">*</span></Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={errors.title ? 'border-destructive' : ''}
                    placeholder="E.g., Large pothole on Main St"
                  />
                  {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location <span className="text-destructive">*</span></Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className={errors.location ? 'border-destructive' : ''}
                    placeholder="Specific address or landmark"
                  />
                  {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description <span className="text-destructive">*</span></Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={5}
                  className={`resize-none ${errors.description ? 'border-destructive' : ''}`}
                  placeholder="Describe the issue in detail, including how long it has been there and its impact..."
                />
                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
              </div>

              {/* Image Upload */}
              <div className="space-y-3">
                <Label>Photo Evidence (Optional)</Label>
                {!previewImage ? (
                  <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/50 hover:border-muted-foreground/50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <UploadCloud className="w-6 h-6 text-primary" />
                    </div>
                    <p className="font-medium text-foreground mb-1">Click to upload a photo</p>
                    <p className="text-xs text-muted-foreground">PNG, JPG or JPEG up to 5MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="relative border rounded-xl p-2 bg-muted/20 inline-block w-full sm:w-auto">
                    <img src={previewImage} alt="Preview" className="w-full sm:w-64 h-48 object-cover rounded-lg border shadow-sm" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-3 -right-3 h-8 w-8 rounded-full shadow-md"
                      onClick={removeImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {errors.image && <p className="text-sm text-destructive mt-1">{errors.image}</p>}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => navigate({ to: '/dashboard' })}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="gap-2 font-semibold">
                  {isLoading ? 'Submitting...' : 'Report Issue'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReportIssue;
