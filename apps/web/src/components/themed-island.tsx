"use client";
import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Island, type IslandProps } from "@pv/island";

const noop = () => () => {};

/** The island follows the site's light/dark choice instead of only the OS setting. */
export function ThemedIsland(props: Omit<IslandProps, "theme">) {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  return <Island {...props} theme={mounted ? (resolvedTheme === "dark" ? "dark" : "light") : "light"} />;
}
