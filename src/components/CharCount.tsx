/** 入力した文字数と上限。上限に届いたらコーラルにする */
export function CharCount({ value, max }: { value: string; max: number }) {
  const n = value.length;
  return (
    <span className={`ml-auto shrink-0 pl-2 text-xs font-normal tabular-nums ${n >= max ? "font-bold text-coral" : "text-muted"}`}>
      {n}/{max}
    </span>
  );
}
