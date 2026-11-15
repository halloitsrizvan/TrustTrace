import { redirect } from "next/navigation";

export default function ClaimsRedirect() {
  redirect("/activity?tab=claims");
}
