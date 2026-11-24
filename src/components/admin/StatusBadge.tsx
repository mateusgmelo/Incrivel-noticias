import { STATUS_LABEL, STATUS_STYLE } from "@/lib/format";
import type { ArticleStatus } from "@/server/db/schema";

export function StatusBadge({ status }: { status: ArticleStatus }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>;
}
