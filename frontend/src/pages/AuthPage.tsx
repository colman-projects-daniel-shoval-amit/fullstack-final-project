import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { authService } from "@/services/authService";

type Mode = "login" | "register";

function saveTokens(token: string, refreshToken: string) {
  localStorage.setItem("token", token);
  localStorage.setItem("refreshToken", refreshToken);
}

export function AuthPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      alert("here")
      const tokens = await authService.login({ email, password });
      alert("after")
      console.log(tokens);
      
      saveTokens(tokens.token, tokens.refreshToken);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const tokens = await authService.register({ email, password });
      saveTokens(tokens.token, tokens.refreshToken);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tokens = await authService.loginWithGoogle();
      saveTokens(tokens.token, tokens.refreshToken);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === "login" ? "register" : "login"));
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {mode === "login" ? "Welcome back" : "Create an account"}
          </CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Sign in to your account to continue"
              : "Enter your details to get started"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <GoogleSignInButton onClick={handleGoogleSignIn} isLoading={isLoading} />

          <div className="flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          {mode === "login" ? (
            <LoginForm
              onSubmit={handleLogin}
              isLoading={isLoading}
              error={error}
            />
          ) : (
            <RegisterForm
              onSubmit={handleRegister}
              isLoading={isLoading}
              error={error}
            />
          )}

          <div className="text-center text-sm text-muted-foreground">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}
            {" "}
            <Button
              variant="link"
              className="p-0 h-auto font-medium text-primary"
              onClick={toggleMode}
            >
              {mode === "login" ? "Sign up" : "Sign in"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
