import type { Metadata } from "next";
import { AuthForm } from "../AuthForm";
import { copy } from "@/lib/copy";

export const metadata: Metadata = { title: copy.auth.loginTitle };

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl">{copy.auth.loginTitle}</h1>
      <AuthForm mode="login" />
    </div>
  );
}
