// @ts-nocheck
import React from 'react';
import { Link } from '@tanstack/react-router';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  MapPin, 
  CheckCircle2, 
  Users2, 
  ShieldCheck, 
  Settings2, 
  ArrowRight,
  Eye,
  Activity
} from 'lucide-react';

const Home = () => {
  const { isAuthenticated } = useAuth();
  
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center text-white overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 hover:scale-105"
          style={{ backgroundImage: 'url("/hero-bg.png")' }}
        ></div>
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/85 via-black/75 to-background backdrop-blur-[3px]"></div>
        
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="text-center animate-fade-in">
            <div className="w-40 h-40 flex items-center justify-center mx-auto mb-8 transform transition-transform hover:scale-105 drop-shadow-2xl">
              <img src="/CivicPulse.png" alt="CivicPulse Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-7xl text-white md:text-white font-bold mb-6 font-display hero-title tracking-tight leading-tight">
              Civic<span className="text-primary">Pulse</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-50/90 mb-10 max-w-2xl mx-auto font-sans leading-relaxed">
              Empowering communities to report, track, and resolve civic issues together. 
              Make your voice heard and build a better future.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Button asChild size="lg" className="bg-white text-primary hover:bg-gray-100 font-bold text-lg px-8 py-6 rounded-xl shadow-amber">
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="bg-white text-primary hover:bg-gray-100 font-bold text-lg px-8 py-6 rounded-xl shadow-amber">
                    <Link to="/register">Get Started</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="bg-white/10 text-white hover:bg-white/20 border-white/30 font-bold text-lg px-8 py-6 rounded-xl backdrop-blur-sm">
                    <Link to="/login">Sign In</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-display text-foreground mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A simple and effective way to address civic issues in your community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <FeatureCard
              icon={<FileText className="w-8 h-8 text-primary" />}
              title="Report Issues"
              description="Easily report civic issues with photos, locations, and detailed descriptions. Track the status of your reports in real-time."
            />
            <FeatureCard
              icon={<Activity className="w-8 h-8 text-primary" />}
              title="Track Progress"
              description="Monitor the status of reported issues as they move through the resolution process. Get notified of important updates."
            />
            <FeatureCard
              icon={<CheckCircle2 className="w-8 h-8 text-primary" />}
              title="Get Resolved"
              description="Watch as authorities address and resolve issues. Provide feedback on the resolution process to help improve services."
            />
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold font-display text-foreground mb-4">Who Can Participate</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Different roles for different needs - everyone has a part to play
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <RoleCard
              icon={<Users2 className="w-7 h-7 text-primary" />}
              title="Citizens"
              description="Report civic issues, track progress, and provide feedback to help improve your community."
              features={['Report Issues', 'Track Status', 'Vote on Issues', 'Give Feedback']}
            />
            <RoleCard
              icon={<ShieldCheck className="w-7 h-7 text-primary" />}
              title="Authorities"
              description="Review and manage reported issues, update status, and coordinate resolution efforts."
              features={['View All Issues', 'Update Status', 'Assign Tasks', 'Generate Reports']}
            />
            <RoleCard
              icon={<Settings2 className="w-7 h-7 text-primary" />}
              title="Administrators"
              description="Manage the entire system, oversee users, and access comprehensive analytics and reports."
              features={['User Management', 'System Analytics', 'Issue Management', 'Full Control']}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold font-display text-foreground mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join our community today and start making your voice heard. 
            Together, we can build better communities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Button asChild size="lg" className="font-bold text-lg px-8 py-6 rounded-xl shadow-amber">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <Button asChild size="lg" className="font-bold text-lg px-8 py-6 rounded-xl shadow-amber">
                <Link to="/register">Create Account</Link>
              </Button>
            )}
            <Button asChild variant="secondary" size="lg" className="font-bold text-lg px-8 py-6 rounded-xl">
              <Link to="/track-issues">Browse Issues</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

// Helper Components
const FeatureCard = ({ icon, title, description }) => {
  return (
    <Card className="text-center hover:shadow-premium transition-all duration-500 border-border group bg-card p-4">
      <CardHeader>
        <div className="w-16 h-16 bg-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/10 group-hover:scale-105 transition-all duration-300">
          {icon}
        </div>
        <CardTitle className="text-2xl font-display tracking-tight">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base text-muted-foreground/80 leading-relaxed font-sans">{description}</CardDescription>
      </CardContent>
    </Card>
  );
};

const RoleCard = ({ icon, title, description, features }) => {
  return (
    <Card className="hover:shadow-premium transition-all duration-500 border-border bg-card overflow-hidden group">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
            {icon}
          </div>
          <CardTitle className="text-2xl font-display tracking-tight">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground/90 mb-8 font-sans leading-relaxed">{description}</p>
        <ul className="space-y-4">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center space-x-3 text-sm">
              <div className="p-0.5 bg-primary/10 rounded-full">
                <ArrowRight className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-foreground/90 font-medium font-sans"> {feature} </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default Home;
