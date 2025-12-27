import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Mail, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://localhost:5000/api";
const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) || window.location.origin;

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  const code = searchParams.get('code');
  const userEmail = searchParams.get('email');

  useEffect(() => {
    setEmail(userEmail ?? '');

    const run = async () => {
      if (!code) {
        setStatus('success');
        setMessage('Check your email for a verification link to complete sign up.');
        return;
      }

      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setStatus('error');
          setMessage(error.message);
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (accessToken) {
          try {
            const pendingProfileRaw = localStorage.getItem('pendingProfile');
            const pendingProfile = pendingProfileRaw ? JSON.parse(pendingProfileRaw) : {};
            await fetch(`${API_BASE_URL}/auth/supabase-sync`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify(pendingProfile),
            });
            localStorage.removeItem('pendingProfile');
          } catch {
            // ignore sync errors; user can still sign in
          }
        }

        setStatus('success');
        setMessage('Email verified successfully. You can now sign in.');
      } catch {
        setStatus('error');
        setMessage('Verification failed. Please try again.');
      }
    };

    run();
  }, [code, userEmail]);

  const handleResendEmail = async () => {
    if (!userEmail) {
      setMessage('Email not found. Please sign up again.');
      return;
    }

    try {
      const redirectTo = `${APP_URL}/verify-email`;
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
        options: { emailRedirectTo: redirectTo },
      });

      if (error) {
        setMessage(error.message);
        return;
      }

      setMessage('Verification email sent again. Please check your inbox.');
    } catch {
      setMessage('Network error. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-br from-background via-background to-orange-950/20" />
      </div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Back to Home */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <Card className="border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-orange-bright flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-display font-semibold">
              Email Verification
            </CardTitle>
            <CardDescription>
              {status === 'loading' && 'Verifying your email...'}
              {status === 'success' && 'Email verified successfully!'}
              {status === 'error' && 'Verification failed'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {status === 'loading' && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {message}
                </p>
                <Link to="/sign-in">
                  <Button variant="hero" className="w-full">
                    Sign In to Your Account
                  </Button>
                </Link>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center space-y-4">
                <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  {message}
                </p>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={handleResendEmail}
                  >
                    Resend Verification Email
                  </Button>
                  <Link to="/sign-in">
                    <Button variant="ghost" className="w-full">
                      Back to Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {email && (
              <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
                Verification sent to: {email}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmailVerification;
