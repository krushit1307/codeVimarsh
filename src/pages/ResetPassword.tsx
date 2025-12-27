import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, KeyRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabaseClient";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [status, setStatus] = useState<"idle" | "exchanging" | "ready" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");

    const run = async () => {
      if (!code) {
        setStatus("ready");
        return;
      }

      setStatus("exchanging");
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setStatus("error");
          setMessage(error.message);
          return;
        }
        setStatus("ready");
      } catch {
        setStatus("error");
        setMessage("Invalid or expired reset link. Please try again.");
      }
    };

    run();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage(error.message);
        return;
      }

      setStatus("success");
      setMessage("Password updated successfully. You can now sign in.");

      setTimeout(() => {
        navigate("/sign-in", { replace: true });
      }, 800);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-br from-background via-background to-orange-950/20" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Link
          to="/sign-in"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>

        <Card className="border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-orange-bright flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-display font-semibold">Reset Password</CardTitle>
            <CardDescription>Set a new password for your account.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {status === "exchanging" && <p className="text-sm text-muted-foreground">Preparing reset session...</p>}

            {status !== "success" && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                {message && (
                  <p className={"text-sm " + (status === "error" ? "text-destructive" : "text-muted-foreground")}>
                    {message}
                  </p>
                )}

                <Button type="submit" className="w-full" variant="hero" disabled={isLoading || status === "exchanging"}>
                  {isLoading ? "Updating..." : "Update Password"}
                </Button>
              </form>
            )}

            {status === "success" && <p className="text-sm text-muted-foreground">{message}</p>}
          </CardContent>

          <CardFooter className="text-center text-sm text-muted-foreground">
            <Link to="/sign-in" className="text-primary hover:underline font-medium">
              Go to Sign In
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
