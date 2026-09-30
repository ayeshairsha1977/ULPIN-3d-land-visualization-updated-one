import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthCard, { FormField, HOME_BY_ROLE } from "@/components/auth/AuthCard";
import { useSession } from "@/lib/SessionContext";

const MIN_PASSWORD = 10;

function validate(form) {
  const errors = {};
  if (!form.full_name.trim()) errors.full_name = "Please enter your name.";
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = "Please enter a valid email address.";
  if (form.password.length < MIN_PASSWORD) errors.password = `Use at least ${MIN_PASSWORD} characters.`;
  if (form.confirm !== form.password) errors.confirm = "Passwords do not match.";
  return errors;
}

export default function Register() {
  const { user, register } = useSession();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  if (user) return <Navigate to={HOME_BY_ROLE[user.role]} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      await register({ full_name: form.full_name.trim(), email: form.email.trim(), password: form.password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setErrors({ ...err.fields, submit: err.message || "Registration failed." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Create a citizen account" subtitle="Submit ULPIN requests, track applications and raise complaints."
      footer={<>Already registered? <Link to="/login" className="font-semibold text-primary hover:underline">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <FormField id="full_name" label="Full name" autoComplete="name" value={form.full_name} onChange={set("full_name")} error={errors.full_name} />
        <FormField id="email" label="Email" type="email" autoComplete="email" value={form.email} onChange={set("email")} error={errors.email} />
        <FormField id="password" label="Password" type="password" autoComplete="new-password" value={form.password} onChange={set("password")} error={errors.password} />
        <FormField id="confirm" label="Confirm password" type="password" autoComplete="new-password" value={form.confirm} onChange={set("confirm")} error={errors.confirm} />
        {errors.submit && <p role="alert" className="text-sm text-red-600">{errors.submit}</p>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}Create account
        </Button>
        <p className="text-[11px] text-muted-foreground">Surveyor and Government accounts are created by an administrator, not through this form.</p>
      </form>
    </AuthCard>
  );
}
