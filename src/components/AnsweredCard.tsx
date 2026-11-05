/** ほかの募集に答えた数（3件以上で、自分の募集のカードに「よく答えている人」の印が付く） */
export function AnsweredCard({ count, title, body, children }: { count: number; title: string; body: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-line bg-card p-3">
      <span className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full bg-card">
        <span className="font-round text-2xl font-bold leading-none tabular-nums">{count}</span>
        <span className="text-[10px] text-muted">答えた</span>
      </span>
      <span className="flex flex-col gap-0.5">
        <b className="text-sm">{title}</b>
        <span className="text-xs leading-relaxed">{body}</span>
        {children}
      </span>
    </div>
  );
}
