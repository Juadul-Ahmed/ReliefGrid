
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { Button } from "@heroui/react";
import {
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiUser,
} from "react-icons/fi";

import { authClient } from "@/lib/auth-client";

import {
  loginSchema,
  registerSchema,
  type LoginFormValues,
  type RegisterFormValues,
} from "@/lib/validations/auth.schema";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isRegister = mode === "register";

  const [showPassword, setShowPassword] = useState(false);

  // Login form
  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: {
      errors: loginErrors,
      isSubmitting: isLoginSubmitting,
    },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Registration form
  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    formState: {
      errors: registerErrors,
      isSubmitting: isRegisterSubmitting,
    },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      termsAccepted: false,
    },
  });

  // Registration handler
  async function onRegister(data: RegisterFormValues) {
    try {
      const result = await authClient.signUp.email({
        name: data.name,
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        toast.error(
          result.error.message || "Unable to create your account.",
        );
        return;
      }

      toast.success("Your ReliefGrid account has been created!");

      router.replace("/onboarding");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  // Login handler
  async function onLogin(data: LoginFormValues) {
    try {
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        toast.error(
          result.error.message || "Invalid email or password.",
        );
        return;
      }

      toast.success("Welcome back to ReliefGrid!");

      router.replace("/auth/continue");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
  }

  const inputClass =
    "h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

  const errorClass = "mt-1.5 text-xs font-medium text-red-500";

  const isSubmitting = isRegister
    ? isRegisterSubmitting
    : isLoginSubmitting;

  return (
    <form
      onSubmit={
        isRegister
          ? handleRegisterSubmit(onRegister)
          : handleLoginSubmit(onLogin)
      }
      noValidate
      className="space-y-5"
    >
      {/* Full name */}
      {isRegister && (
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Full name
          </label>

          <div className="relative">
            <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              id="name"
              type="text"
              placeholder="Enter your full name"
              autoComplete="name"
              className={inputClass}
              {...registerRegister("name")}
            />
          </div>

          {registerErrors.name && (
            <p className={errorClass}>
              {registerErrors.name.message}
            </p>
          )}
        </div>
      )}

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Email address
        </label>

        <div className="relative">
          <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className={inputClass}
            {...(isRegister
              ? registerRegister("email")
              : registerLogin("email"))}
          />
        </div>

        {(isRegister
          ? registerErrors.email
          : loginErrors.email) && (
          <p className={errorClass}>
            {isRegister
              ? registerErrors.email?.message
              : loginErrors.email?.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-sm font-semibold text-slate-700"
          >
            Password
          </label>

          {!isRegister && (
            <span className="cursor-default text-xs font-medium text-slate-400">
              Forgot password?
            </span>
          )}
        </div>

        <div className="relative">
          <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />

          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder={
              isRegister
                ? "Create a password"
                : "Enter your password"
            }
            autoComplete={
              isRegister
                ? "new-password"
                : "current-password"
            }
            className={`${inputClass} pr-12`}
            {...(isRegister
              ? registerRegister("password")
              : registerLogin("password"))}
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword((previous) => !previous)
            }
            aria-label={
              showPassword ? "Hide password" : "Show password"
            }
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
          >
            {showPassword ? (
              <FiEyeOff size={18} />
            ) : (
              <FiEye size={18} />
            )}
          </button>
        </div>

        {(isRegister
          ? registerErrors.password
          : loginErrors.password) && (
          <p className={errorClass}>
            {isRegister
              ? registerErrors.password?.message
              : loginErrors.password?.message}
          </p>
        )}

        {isRegister && (
          <p className="mt-2 text-xs text-slate-400">
            Your password must contain at least 8 characters.
          </p>
        )}
      </div>

      {/* Remember me */}
      {!isRegister && (
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 accent-emerald-600"
          />
          Keep me signed in
        </label>
      )}

      {/* Terms and conditions */}
      {isRegister && (
        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-6 text-slate-500">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-300 accent-emerald-600"
              {...registerRegister("termsAccepted")}
            />

            <span>
              I agree to the ReliefGrid terms of service and privacy policy.
            </span>
          </label>

          {registerErrors.termsAccepted && (
            <p className={errorClass}>
              {registerErrors.termsAccepted.message}
            </p>
          )}
        </div>
      )}

      {/* Submit button */}
      <Button
        type="submit"
        variant="primary"
        isDisabled={isSubmitting}
        className="h-12 w-full rounded-xl bg-[#101D35] font-semibold text-white transition hover:bg-[#1A3155]"
      >
        {isSubmitting
          ? isRegister
            ? "Creating account..."
            : "Signing in..."
          : isRegister
            ? "Create your account"
            : "Sign in to ReliefGrid"}
      </Button>

      <p className="text-center text-xs leading-5 text-slate-400">
        Your access is protected by ReliefGrid authentication.
      </p>
    </form>
  );
}
