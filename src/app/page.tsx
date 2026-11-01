import Link from "next/link";

import { Header } from "@/components/Header";

const STEPS = [
  { title: "作ったものを貼る", body: "名前と URL、画面の写真を入れて、聞きたいことを選ぶ" },
  { title: "リンクを送る", body: "X や友だちに送るだけ。答える人は登録なし、30秒" },
  { title: "意見が届く", body: "第一印象、使いたいか、迷ったところ。AI がまとめます" },
];

/** はじめの画面 */
export default function Home() {
  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-10 px-4 pb-20 pt-12">
        <section className="flex flex-col gap-5">
          <h1 className="font-round text-4xl font-bold leading-tight">
            作ったものに、
            <br />
            人の意見を。
          </h1>
          <p className="leading-relaxed text-muted">
            一人で作っていると、意見をくれる人がいない。AI と壁打ちするしかない。
            <br />
            意見リンクは、作ったものの URL を貼るだけで、本物の人の意見が集まるリンクを作れます。
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/new" className="flex min-h-12 items-center justify-center rounded-full bg-coral px-6 font-bold text-night">
              意見リンクを作る（無料）
            </Link>
            <Link href="/l/demo" className="flex min-h-12 items-center justify-center rounded-full border border-line px-6 font-bold">
              答える側を試す
            </Link>
          </div>
        </section>

        <ol className="flex flex-col gap-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="flex gap-4 rounded-2xl border border-line bg-card p-4">
              <span className="font-round flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-peach font-bold text-night">{i + 1}</span>
              <span className="flex flex-col gap-1">
                <span className="font-bold">{s.title}</span>
                <span className="text-sm leading-relaxed text-muted">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>

        <section className="flex flex-col gap-2 rounded-2xl bg-leaf-tint p-4">
          <h2 className="font-bold">いちばん大事な「5秒テスト」</h2>
          <p className="text-sm leading-relaxed">
            答える人には、まず画面を5秒だけ見せて「何のサービスに見えたか」を聞きます。説明を読む前の、本当の第一印象は、AI には出せない人間だけの答えです。
          </p>
        </section>
      </main>
    </>
  );
}
