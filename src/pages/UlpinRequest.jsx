import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/common/PageHeader";
import WizardProgress from "@/components/ulpin/WizardProgress";
import StepLocation from "@/components/ulpin/StepLocation";
import StepParcel from "@/components/ulpin/StepParcel";
import StepApplicant from "@/components/ulpin/StepApplicant";
import StepDocuments from "@/components/ulpin/StepDocuments";
import StepReview from "@/components/ulpin/StepReview";
import SubmitSuccess from "@/components/ulpin/SubmitSuccess";
import { STEPS, blankForm, fromProperty, validate } from "@/components/ulpin/formModel";
import { getProperty } from "@/data/properties";
import { useRole } from "@/hooks/useRole";
import { useInvalidate } from "@/hooks/useData";
import { submitApplication } from "@/services/workflow";

export default function UlpinRequest() {
  const { user } = useRole();
  const invalidate = useInvalidate();
  const [form, setForm] = useState(() => {
    const p = getProperty(new URLSearchParams(window.location.search).get("property"));
    return { ...blankForm(user), ...(p ? fromProperty(p) : {}) };
  });
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(null);

  const patch = (obj) => setForm((f) => ({ ...f, ...obj }));
  const set = (k) => (v) => patch({ [k]: v });
  const next = () => {
    const e = validate(step, form);
    setErrors(e);
    if (!Object.keys(e).length) setStep(step + 1);
  };

  const submit = async () => {
    setSaving(true);
    setSubmitError("");
    try {
      const app = await submitApplication({ ...form, latitude: Number(form.latitude), longitude: Number(form.longitude) });
      invalidate("ULPINApplication", "PropertyStatus", "PropertyHistory", "Notification");
      setDone(app);
    } catch (error) {
      console.error("ULPIN application submission failed", error);
      setSubmitError("We couldn't submit your application. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="px-4 py-16">
        <SubmitSuccess label="Application ID" number={done.application_number} message="Application submitted successfully."
          primary={{ to: "/applications", label: "Track Application" }}
          secondary={done.property_id ? { to: `/property/${done.property_id}`, label: "Back to Property" } : null} />
      </div>
    );
  }

  const Step = [StepLocation, StepParcel, StepApplicant, StepDocuments, StepReview][step];
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <PageHeader eyebrow="ULPIN Application" title="Request ULPIN" subtitle="Submit a demo ULPIN application. Known property details are prefilled when you start from a property." />
      <WizardProgress steps={STEPS} current={step} />
      <div className="bg-card border border-line rounded-2xl p-6 sm:p-8">
        <h2 className="text-lg font-bold text-ink mb-6">Step {step + 1} — {STEPS[step]}</h2>
        <Step form={form} set={set} patch={patch} errors={errors} goTo={setStep} />
        {submitError && <p className="mt-4 text-sm text-red-600">{submitError}</p>}
        <div className="mt-8 flex justify-between gap-3">
          <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0 || saving}><ChevronLeft className="w-4 h-4 mr-1" />Back</Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>Continue<ChevronRight className="w-4 h-4 ml-1" /></Button>
          ) : (
            <Button onClick={submit} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Submit ULPIN Request</Button>
          )}
        </div>
      </div>
    </div>
  );
}