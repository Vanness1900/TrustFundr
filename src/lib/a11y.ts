/** Collapse whitespace and cap length for accessible names (buttons, aria-label). */
export function shortTitleForAria(title: string | null | undefined, max = 80): string {
  const raw = typeof title === "string" ? title : "";
  const t = raw.replace(/\s+/g, " ").trim() || "Campaign";
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}
