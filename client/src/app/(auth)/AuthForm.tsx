"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { copy } from "@/lib/copy";
import { keys } from "@/lib/api/hooks";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "1";

const loginSchema = z.object({
  email: z.string().email(copy.auth.emailInvalid),
  password: z.string().min(1, copy.auth.required),
});
const registerSchema = z.object({
  name: z.string().min(2, copy.auth.nameShort),
  email: z.string().email(copy.auth.emailInvalid),
  password: z.string().min(8, copy.auth.passwordShort),
});
type Values = { name?: string; email: string; password: string };

async function authCall(kind: "login" | "register", body: Values) {
  const res = await fetch(`/api/auth/${kind}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()) as { user: { role: string } };
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const qc = useQueryClient();
  const next = useSearchParams().get("next");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(mode === "login" ? loginSchema : registerSchema) as never,
    defaultValues: { name: "", email: "", password: "" },
  });
  const { register, handleSubmit, formState } = form;
  const e = formState.errors;
  const t = copy.auth;

  async function go(v: Values) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await authCall(mode, v);
      qc.clear();
      await qc.invalidateQueries({ queryKey: keys.me });
      const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      router.replace(safe ?? (r.user.role === "ADMIN" ? "/admin" : "/board"));
    } catch {
      setError(mode === "login" ? t.failed : t.registerFailed);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit(go)} noValidate className="space-y-4" data-testid={`${mode}-form`}>
        {mode === "register" ? (
          <Field label={t.name} error={e.name?.message}>
            {(p) => <Input {...p} autoComplete="name" {...register("name")} />}
          </Field>
        ) : null}
        <Field label={t.email} error={e.email?.message}>
          {(p) => <Input {...p} type="email" inputMode="email" autoComplete="email" {...register("email")} />}
        </Field>
        <Field label={t.password} error={e.password?.message}>
          {(p) => (
            <Input {...p} type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} {...register("password")} />
          )}
        </Field>
        {error ? (
          <p role="alert" className="rounded-[12px] bg-rejected-tint p-3 text-sm font-bold text-rejected-ink">
            {error}
          </p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" disabled={busy} data-testid="auth-submit">
          {mode === "login" ? copy.action.signIn : copy.action.signUp}
        </Button>
        <p className="text-center text-ink-soft">
          {mode === "login" ? t.noAccount : t.hasAccount}{" "}
          <Link href={mode === "login" ? "/register" : "/login"} className="font-bold text-ultra underline underline-offset-4">
            {mode === "login" ? copy.action.signUp : copy.action.signIn}
          </Link>
        </p>
      </form>

      {DEMO && mode === "login" ? (
        <section aria-labelledby="demo-h" className="rounded-[14px] border border-dashed border-rule p-4">
          <h2 id="demo-h" className="font-display text-lg">
            {t.demoTitle}
          </h2>
          <p className="text-sm text-ink-soft">{t.demoHint}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {t.demo.map((d) => (
              <button
                key={d.key}
                type="button"
                disabled={busy}
                data-testid={`demo-${d.key}`}
                onClick={() => go({ email: d.email, password: t.demoPassword })}
                className="min-h-14 rounded-[12px] border border-rule bg-surface px-3 py-2 text-left hover:bg-ultra-tint active:scale-[0.98] disabled:opacity-50"
              >
                <span className="block font-bold">{d.label}</span>
                <span className="block text-sm text-ink-soft">{d.note}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
