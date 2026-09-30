import React, { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthCard, { FormField, HOME_BY_ROLE, safeNext } from "@/components/auth/AuthCard";
import { useSession } from "@/lib/SessionContext";

const DEMO_ACCOUNTS = [
  ["Citizen", "citizen@demo.local"],
  ["Surveyor", "surveyor@demo.local"],
  ["Government", "government@demo.local"],
];

export default function Login() {
  const { user, signIn } = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (user) return <Navigate to={safeNext(params.get("next"), HOME_BY_ROLE[user.role])} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const signedIn = await signIn(email, password);
      navigate(safeNext(params.get("next"), HOME_BY_ROLE[signedIn.role]), { replace: true });
    } catch (err) {
      setError(err.message || "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Sign in" subtitle="Citizens, surveyors and government reviewers use the same sign-in."
      footer={<>New here? <Link to="/register" className="font-semibold text-primary hover:underline">Create a citizen account</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormField id="email" label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <FormField id="password" label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" disabled={busy || !email || !password}>
          {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}Sign in
        </Button>
        <div className="text-right"><Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-ink">Forgot password?</Link></div>
      </form>
      <div className="mt-6 rounded-lg border border-dashed border-amber-300 bg-amber-50 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">Demo accounts</p>
        <p className="text-xs text-amber-900 mt-1">Created by <code>npm run db:seed</code>. The password is whatever was set in <code>SEED_DEMO_PASSWORD</code>.</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DEMO_ACCOUNTS.map(([label, demoEmail]) => (
            <button key={demoEmail} type="button" onClick={() => setEmail(demoEmail)}
              className="rounded border border-amber-300 bg-white px-2 py-1 text-xs text-amber-900 hover:bg-amber-100">{label}</button>
          ))}
        </div>
      </div>
    </AuthCard>
  );
}
