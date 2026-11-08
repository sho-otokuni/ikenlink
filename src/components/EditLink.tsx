"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { NewLinkForm, type EditTarget } from "@/components/NewLinkForm";
import { fetchResults } from "@/lib/links";

/** 作った募集を読み込んで、直すフォームを出す。自分の募集でなければ直せない */
export function EditLink({ id }: { id: string }) {
  // undefined＝読み込み中／null＝見つからない（自分のものでない）
  const [target, setTarget] = useState<EditTarget | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  // 読み込むたびに増やす。画面に戻ってきたとき、前の入力のまま残らないよう、フォームを作り直すため
  const [loads, setLoads] = useState(0);

  useEffect(() => {
    let alive = true;
    fetchResults(id).then((r) => {
      if (!alive) return;
      if (!r.ok) return setError(r.message);
      setTarget(r.data ? { link: r.data.link, isPublic: r.data.isPublic ?? false, responseCount: r.data.responses.length } : null);
      setLoads((n) => n + 1);
    });
    return () => {
      alive = false;
    };
  }, [id]);

  if (error) return <p role="alert" className="mt-4 text-sm font-bold text-coral">{error}</p>;
  if (target === undefined) return <div className="mt-4 h-40 rounded-lg bg-line" aria-busy />;
  if (target === null) {
    return (
      <div className="mt-4 flex flex-col items-start gap-3">
        <p className="text-sm leading-relaxed">この募集は直せません。作ったブラウザで開くか、作ったアカウントでログインしてください。</p>
        <Link href="/me" className="flex min-h-11 items-center font-bold text-coral">
          自分の募集へ
        </Link>
      </div>
    );
  }
  return <NewLinkForm key={loads} editing={target} />;
}
