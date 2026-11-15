import type { Metadata } from "next";
import { AuthForm } from "../AuthForm";
import { copy } from "@/lib/copy";

export const metadata: Metadata = { title: copy.auth.registerTitle };

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">{copy.auth.registerTitle}</h1>
      <AuthForm mode="register" />
    </div>
  );
}
