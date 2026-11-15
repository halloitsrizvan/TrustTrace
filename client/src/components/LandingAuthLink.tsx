"use client";
import Link from "next/link";
import { copy } from "@/lib/copy";
import { useMe } from "@/lib/api/hooks";
import { firstName } from "@/lib/utils";
import { Avatar } from "./Avatar";

/** Sign in link for visitors; the user's name once signed in. */
export function LandingAuthLink() {
  const me = useMe();
  if (me.isLoading) return <span aria-hidden className="inline-block min-h-11 w-20" />;
  if (me.data) {
    return (
      <Link href="/me" className="printed inline-flex min-h-11 items-center gap-2 rounded-full bg-surface py-1 pl-1.5 pr-4 font-bold" aria-label={me.data.name}>
        <Avatar name={me.data.name} size={32} />
        <span className="max-w-32 truncate">{firstName(me.data.name)}</span>
      </Link>
    );
  }
  return (
    <Link href="/login" className="inline-flex min-h-11 items-center rounded-2xl px-3 font-bold">
      {copy.action.signIn}
    </Link>
  );
}
