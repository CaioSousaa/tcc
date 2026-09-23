import { LabelColor } from "./labels";

export const LABEL_DOT_CLASSES: Record<LabelColor, string> = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  gold: "bg-amber-500",
  purple: "bg-purple-500",
  gray: "bg-zinc-500",
};

export const LABEL_CHIP_CLASSES: Record<LabelColor, string> = {
  red: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  green:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  gold: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  purple:
    "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  gray: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};
