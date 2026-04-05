import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft, Shield, ScanLine } from "lucide-react";
import { Link } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") || "agent";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const isAdmin = role === "admin";
  const panelLabel = isAdmin ? "Admin" : "Agent";
  const redirectPath = isAdmin ? "/admin" : "/agent";

  const checkAdminRole = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return !!data;
  };

  const checkAgentApproval = async (userId: string) => {
    const { data } = await supabase
      .from("agents")
      .select("approval_status")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return "not_found";
    return data.approval_status;
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (isAdmin) {
        const isAdminUser = await checkAdminRole(data.user.id);
        if (!isAdminUser) {
          await supabase.auth.signOut();
          toast.error("You are not authorized as an admin");
          return;
        }
      } else {
        const status = await checkAgentApproval(data.user.id);
        if (status === "pending") {
          await supabase.auth.signOut();
          toast.error("Your account is pending admin approval");
          return;
        }
        if (status === "rejected") {
          await supabase.auth.signOut();
          toast.error("Your account has been rejected by admin");
          return;
        }
        if (status === "not_found") {
          await supabase.auth.signOut();
          toast.error("Agent profile not found. Please sign up first.");
          return;
        }
      }

      localStorage.setItem("cmf_role", role);
      localStorage.setItem("cmf_email", data.user?.email || "");
      toast.success(`Logged in as ${panelLabel}`);
      navigate(redirectPath);
    } catch (error: any) {
      toast.error(error.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (isAdmin) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      // Create agent record with pending status
      if (data.user) {
        await supabase.from("agents").insert({
          name: email.split("@")[0],
          phone: "",
          email,
          user_id: data.user.id,
          approval_status: "pending",
        });
      }

      toast.success("Account created! Please wait for admin approval before signing in.");
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) { toast.error("Google sign-in failed"); return; }
      if (result.redirected) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("No session found"); return; }

      if (isAdmin) {
        const isAdminUser = await checkAdminRole(session.user.id);
        if (!isAdminUser) {
          await supabase.auth.signOut();
          toast.error("You are not authorized as an admin");
          return;
        }
      } else {
        const status = await checkAgentApproval(session.user.id);
        if (status === "not_found") {
          // Auto-create agent record
          await supabase.from("agents").insert({
            name: session.user.email?.split("@")[0] || "Agent",
            phone: "",
            email: session.user.email || "",
            user_id: session.user.id,
            approval_status: "pending",
          });
          await supabase.auth.signOut();
          toast.error("Account created! Please wait for admin approval.");
          return;
        }
        if (status === "pending") {
          await supabase.auth.signOut();
          toast.error("Your account is pending admin approval");
          return;
        }
        if (status === "rejected") {
          await supabase.auth.signOut();
          toast.error("Your account has been rejected");
          return;
        }
      }

      localStorage.setItem("cmf_role", role);
      localStorage.setItem("cmf_email", session.user.email || "");
      toast.success(`Signed in with Google as ${panelLabel}`);
      navigate(redirectPath);
    } catch (error: any) {
      toast.error(error.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {isAdmin ? (
            <Shield className="h-10 w-10 mx-auto text-primary mb-2" />
          ) : (
            <ScanLine className="h-10 w-10 mx-auto text-primary mb-2" />
          )}
          <CardTitle>{panelLabel} Login</CardTitle>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? "Admin access only" : "Sign in to access the Agent Panel"}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" variant="outline" onClick={handleGoogleSignIn} disabled={loading}>
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
          </div>
          <Button className="w-full" onClick={handleLogin} disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
          {!isAdmin && (
            <Button className="w-full" variant="outline" onClick={handleSignUp} disabled={loading}>
              Create Agent Account
            </Button>
          )}
          <Link to="/">
            <Button variant="ghost" className="w-full mt-2"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
