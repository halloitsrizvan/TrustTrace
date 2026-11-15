"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Segmented } from "@/components/ui/segmented";
import { copy } from "@/lib/copy";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <Segmented
      label={copy.profile.theme}
      value={(mounted ? theme : "system") as "system" | "light" | "dark"}
      onChange={setTheme}
      options={[
        { value: "system", label: copy.profile.themeSystem },
        { value: "light", label: copy.profile.themeLight },
        { value: "dark", label: copy.profile.themeDark },
      ]}
    />
  );
}
