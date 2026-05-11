/** Collapse whitespace and cap length for accessible names (buttons, aria-label). */
export function shortTitleForAria(title: string, max = 80): string {
  const t = title.replace(/\s+/g, " ").trim() || "Campaign";
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}
