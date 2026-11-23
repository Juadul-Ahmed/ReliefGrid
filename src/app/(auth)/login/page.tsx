
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      description="Sign in to your account and continue coordinating your response operations."
      footerText="New to ReliefGrid?"
      footerLinkText="Create an account"
      footerHref="/register"
    >
      <AuthForm mode="login" />
    </AuthShell>
  );
}
