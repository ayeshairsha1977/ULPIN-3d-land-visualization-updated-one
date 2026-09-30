import React from "react";
import { Link } from "react-router-dom";
import AuthCard from "@/components/auth/AuthCard";

// This prototype sends no email, so self-service reset is not available.
export default function ForgotPassword() {
  return (
    <AuthCard title="Reset your password" subtitle="Password reset by email is not available in this prototype."
      footer={<Link to="/login" className="font-semibold text-primary hover:underline">Back to sign in</Link>}>
      <p className="text-sm text-muted-foreground">
        Ask the person who runs this deployment to reset it. Demo accounts can be reset by re-running
        <code className="mx-1">npm run db:seed</code>with a new <code>SEED_DEMO_PASSWORD</code>.
      </p>
    </AuthCard>
  );
}
