
"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "react-toastify";

import { submitContactForm } from "@/app/actions/contact-form";

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";
const labelClass = "mb-1.5 block text-sm font-medium";
const errorClass = "mt-1 text-xs text-red-500";

interface ContactFormValues {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ContactFormValues>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormValues, string[]>>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const handleChange = (
    key: keyof ContactFormValues,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
    if (serverError) {
      setServerError(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setServerError(null);

    // Client-side validation.
    const nextErrors: Partial<Record<keyof ContactFormValues, string[]>> = {};

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      nextErrors.name = ["Name must be at least 2 characters"];
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nextErrors.email = ["Please enter a valid email address"];
    }

    if (!formData.subject.trim() || formData.subject.trim().length < 5) {
      nextErrors.subject = ["Subject must be at least 5 characters"];
    }

    if (!formData.message.trim() || formData.message.trim().length < 10) {
      nextErrors.message = ["Message must be at least 10 characters"];
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error("Please check the form for errors.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitContactForm(formData);

      if (result.success) {
        toast.success(result.message);
        setFormData({ name: "", email: "", subject: "", message: "" });
        setErrors({});
      } else {
        setServerError(result.message);
        toast.error(result.message);
        if (result.errors) {
          setErrors(result.errors);
        }
      }
    } catch {
      setServerError(
        "Something went wrong while submitting your message. Please try again.",
      );
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            Contact ReliefGrid
          </span>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Get in Touch
          </h1>

          <p className="mt-6 leading-8 text-muted max-w-lg mx-auto">
            Have questions about ReliefGrid, emergency response coordination,
            or joining the platform? Send us a message and we&apos;ll get back to
            you.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-7 sm:p-9 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="name" className={labelClass}>
                Full Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Jane Doe"
                className={
                  inputClass +
                  (errors.name ? " border-red-500" : "")
                }
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && (
                <p className={errorClass}>{errors.name[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className={labelClass}>
                Email Address *
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="jane@example.com"
                className={
                  inputClass +
                  (errors.email ? " border-red-500" : "")
                }
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && (
                <p className={errorClass}>{errors.email[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="subject" className={labelClass}>
                Subject *
              </label>
              <input
                id="subject"
                type="text"
                value={formData.subject}
                onChange={(e) => handleChange("subject", e.target.value)}
                placeholder="Question about incident reporting"
                className={
                  inputClass +
                  (errors.subject ? " border-red-500" : "")
                }
                aria-invalid={Boolean(errors.subject)}
              />
              {errors.subject && (
                <p className={errorClass}>{errors.subject[0]}</p>
              )}
            </div>

            <div>
              <label htmlFor="message" className={labelClass}>
                Message *
              </label>
              <textarea
                id="message"
                rows={6}
                value={formData.message}
                onChange={(e) => handleChange("message", e.target.value)}
                placeholder="Tell us how we can help..."
                className={
                  inputClass +
                  " min-h-[150px]" +
                  (errors.message ? " border-red-500" : "")
                }
                aria-invalid={Boolean(errors.message)}
              />
              {errors.message && (
                <p className={errorClass}>{errors.message[0]}</p>
              )}
            </div>

            {serverError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-500">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>

        <div className="mt-12 p-6 rounded-xl border border-border bg-surface-secondary">
          <h3 className="text-lg font-semibold text-foreground">
            Other ways to reach us
          </h3>
          <p className="mt-2 text-sm text-muted">
            For emergency incidents, please use the{" "}
            <Link href="/report-incident" className="text-primary font-medium hover:underline">
              Report an Incident
            </Link>{" "}
            page instead of this contact form.
          </p>
        </div>
      </div>
    </main>
  );
}
