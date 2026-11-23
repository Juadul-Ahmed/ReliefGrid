
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Join ReliefGrid and become part of a more coordinated disaster response network."
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerHref="/login"
    >
      <AuthForm mode="register" />
    </AuthShell>
  );
}
