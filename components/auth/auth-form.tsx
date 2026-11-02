"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { errorProps, FieldError, focusFirstError } from "@/components/field-error";
import { client } from "@/lib/neon/client";
import { validateSignIn, validateSignUp } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const isSignUp = mode === "sign-up";
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const signUp = validateSignUp({ name, email, password });
  const signIn = validateSignIn({ email, password });
  const errors = attempted ? (isSignUp ? signUp.errors : signIn.errors) : {};

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setAttempted(true);
    if (isSignUp ? !signUp.success : !signIn.success) {
      focusFirstError();
      return;
    }
    setSubmitting(true);
    try {
      const { error: authError } =
        isSignUp && signUp.data
          ? await client.auth.signUp.email(signUp.data)
          : await client.auth.signIn.email(signIn.data ?? { email, password });

      if (authError) {
        setError(authError.message || "Something went wrong. Please try again.");
        return;
      }

      // Load the session before navigating, so the next page's guard
      // doesn't send a signed-in user back to the login page.
      await client.auth.getSession();
      router.replace("/workouts");
    } catch {
      setError("Couldn't reach the login service. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <form noValidate onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>
            <h1>{isSignUp ? "Create your account" : "Welcome back"}</h1>
          </CardTitle>
          <CardDescription>
            {isSignUp
              ? "Keep all your training in one place."
              : "Log in to see your training."}
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4 flex flex-col gap-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {isSignUp && (
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                autoComplete="name"
                required
                {...errorProps("name-error", errors.name)}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <FieldError id="name-error" message={errors.name} />
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              {...errorProps("email-error", errors.email)}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <FieldError id="email-error" message={errors.email} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              aria-describedby={isSignUp ? "password-hint" : undefined}
              {...errorProps("password-error", errors.password)}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <FieldError id="password-error" message={errors.password} />
            {isSignUp && !errors.password && (
              <p id="password-hint" className="text-sm text-muted-foreground">
                At least 8 characters.
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="mt-4 flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {isSignUp ? "Create account" : "Log in"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {isSignUp ? "Already have an account? " : "Need an account? "}
            <Link
              href={isSignUp ? "/auth/sign-in" : "/auth/sign-up"}
              className="inline-block py-3 underline underline-offset-4"
            >
              {isSignUp ? "Log in" : "Sign up"}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
