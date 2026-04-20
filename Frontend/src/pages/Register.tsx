// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useRouter } from '@tanstack/react-router';
import { useAuth } from '../context/AuthContext';
import { register as registerAPI } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'citizen',
    adminCode: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showAdminCode, setShowAdminCode] = useState(false);
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: '/dashboard', replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
  };

  const handleRoleChange = (value) => {
    setFormData(prev => ({ ...prev, role: value, adminCode: '' }));
    if (errors.adminCode) setErrors(prev => ({ ...prev, adminCode: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    else if (formData.name.length < 2) newErrors.name = 'Name must be at least 2 characters';
    
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (formData.role === 'admin' && !formData.adminCode) {
      newErrors.adminCode = 'Admin secret code is required';
    }
    
    if (!termsAccepted) newErrors.terms = 'You must accept the terms and conditions';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const { confirmPassword, ...registrationData } = formData;
      const response = await registerAPI(registrationData);
      const payload = response.data?.data ?? response.data;
      if (payload) {
        toast.success("Registration successful! Please sign in.");
        navigate({ to: '/login', state: { email: formData.email } });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-muted/30">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-fade-in shadow-sm">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold font-display text-foreground">Create Account</h1>
          <p className="text-muted-foreground mt-2">Join CivicTracker to make a difference</p>
        </div>

        <Card className="border-border shadow-card hover:shadow-card-hover transition-all duration-300">
          <CardHeader>
            <CardTitle>Sign Up</CardTitle>
            <CardDescription>Fill out the form below to register.</CardDescription>
          </CardHeader>
          <CardContent>
            {errors.general && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Registration Failed</AlertTitle>
                <AlertDescription>{errors.general}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'border-destructive' : ''}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-3 pb-2 pt-1 border-y my-4">
                <Label>Account Type</Label>
                <RadioGroup value={formData.role} onValueChange={handleRoleChange} className="space-y-2">
                  <div className="flex items-start space-x-3 bg-muted/20 p-3 rounded-lg border">
                    <RadioGroupItem value="citizen" id="r1" className="mt-1" />
                    <Label htmlFor="r1" className="font-normal cursor-pointer flex-1">
                      <span className="block font-medium">Citizen</span>
                      <span className="text-xs text-muted-foreground">Report and track civic issues</span>
                      <span className="block text-xs text-green-600 mt-1">✅ Requires @gmail.com</span>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-3 bg-muted/20 p-3 rounded-lg border">
                    <RadioGroupItem value="manager" id="r2" className="mt-1" />
                    <Label htmlFor="r2" className="font-normal cursor-pointer flex-1">
                      <span className="block font-medium">Manager</span>
                      <span className="text-xs text-muted-foreground">Handle and resolve citizen issues (requires admin approval)</span>
                      <span className="block text-xs text-blue-600 mt-1">🛡️ Requires @manager.com</span>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-3 bg-muted/20 p-3 rounded-lg border">
                    <RadioGroupItem value="authority" id="r3" className="mt-1" />
                    <Label htmlFor="r3" className="font-normal cursor-pointer flex-1">
                      <span className="block font-medium">Authority</span>
                      <span className="text-xs text-muted-foreground">Manage and resolve issues (government official)</span>
                      <span className="block text-xs text-orange-600 mt-1">⚠️ Requires @gov.in</span>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-3 bg-purple-50 border-purple-200 border p-3 rounded-lg dark:bg-purple-950/20">
                    <RadioGroupItem value="admin" id="r4" className="mt-1" />
                    <Label htmlFor="r4" className="font-normal cursor-pointer flex-1">
                      <span className="block font-medium text-purple-900 dark:text-purple-200">Admin</span>
                      <span className="text-xs text-muted-foreground">Full system access (requires secret code)</span>
                      <span className="block text-xs text-purple-600 mt-1">🔐 Requires @admin.com + secret code</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Admin Secret Code — conditional field */}
              {formData.role === 'admin' && (
                <div className="space-y-2 p-4 bg-purple-50 border border-purple-200 rounded-xl dark:bg-purple-950/20 dark:border-purple-800">
                  <Label htmlFor="adminCode" className="flex items-center gap-2 text-purple-800 dark:text-purple-200 font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    Admin Secret Code
                  </Label>
                  <div className="relative">
                    <Input
                      id="adminCode"
                      name="adminCode"
                      type={showAdminCode ? 'text' : 'password'}
                      placeholder="Enter the admin secret code"
                      value={formData.adminCode}
                      onChange={handleChange}
                      className={`pr-10 ${errors.adminCode ? 'border-destructive' : 'border-purple-300 focus:border-purple-500'}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAdminCode(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showAdminCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.adminCode && <p className="text-sm text-destructive">{errors.adminCode}</p>}
                  <p className="text-xs text-purple-600 dark:text-purple-400">Contact your system administrator to obtain the secret code.</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'border-destructive' : ''}
                />
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'border-destructive' : ''}
                />
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(c) => setTermsAccepted(c)} />
                <div className="grid leading-none gap-1.5">
                  <Label htmlFor="terms" className="text-sm font-medium leading-none cursor-pointer">
                    Accept terms and conditions
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    I agree to the Terms of Service and Privacy Policy.
                  </p>
                  {errors.terms && <p className="text-sm text-destructive">{errors.terms}</p>}
                </div>
              </div>

              <Button type="submit" className="w-full mt-4" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t p-4 bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Register;
