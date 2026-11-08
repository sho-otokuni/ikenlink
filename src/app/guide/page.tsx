import type { Metadata } from "next";
import Link from "next/link";

import { DocPage, DocSection } from "@/components/DocPage";

export const metadata: Metadata = {
  title: "使い方｜意見リンク",
  description: "意見リンクの使い方。意見を募集する人と、答える人のための説明です。",
};

/** 使い方 */
export default function GuidePage() {
  return (
    <DocPage
      title="使い方"
      lead={
        <p>
          意見リンクは、アイデアや作りかけのもの、作ったものに「これ、どう思う？」と意見を集めるためのサービスです。
          画像や URL を貼るだけで、意見が集まるリンクができます。
        </p>
      }
    >
      <DocSection title="意見を募集する">
        <ol>
          <li>
            <Link href="/new" className="font-bold text-coral underline-offset-2 hover:underline">
              意見を募集する
            </Link>
            を開きます。
          </li>
          <li>見てほしいものの種類を選び、タイトルを入れます。</li>
          <li>画像（4枚まで）、説明、URL（5つまで）を入れます。どれもなくてもかまいません。まだ形になっていなくても、画像1枚から聞けます。</li>
          <li>聞きたいことを選びます。自分で質問を書くこともできます。</li>
          <li>締め切りと公開範囲を選び、表示名を入れて「募集を始める」を押します。</li>
        </ol>
        <p>できたリンクを、X や LINE、友だちに送ってください。</p>
      </DocSection>

      <DocSection title="公開範囲">
        <ul>
          <li>
            <b>公開（誰でも回答可）</b>：
            <Link href="/list" className="font-bold text-coral underline-offset-2 hover:underline">
              みんなの募集
            </Link>
            の一覧に並び、誰でも回答できます。
          </li>
          <li>
            <b>非公開（リンクを知っている人だけ）</b>：一覧には並びません。リンクを送った相手だけが回答できます。
          </li>
        </ul>
        <p>どちらの場合も、届いた意見を読めるのは募集した人だけです。公開範囲はあとから変えられます。</p>
      </DocSection>

      <DocSection title="締め切り">
        <p>締め切りを過ぎると答えられなくなり、「みんなの募集」の一覧からも外れます。届いた意見の画面から、締め切りを延ばしたり、すぐに締め切ったり、再開したりできます。</p>
      </DocSection>

      <DocSection title="届いた意見を見る">
        <ul>
          <li>
            <Link href="/me" className="font-bold text-coral underline-offset-2 hover:underline">
              自分の募集
            </Link>
            から、作った募集と届いた意見を見られます。
          </li>
          <li>届いた意見の画面の「編集する」から、募集の中身を直せます。意見が届いたあとは、答えと質問がずれないよう、質問だけは変えられません。</li>
          <li>X などに貼ったときは、タイトルと1枚目の画像が入ったカードが出ます。</li>
        </ul>
      </DocSection>

      <DocSection title="答える">
        <ul>
          <li>リンクを開けば、登録なしでそのまま答えられます。答えるのにかかるのは30秒ほどです。</li>
          <li>送った意見を読めるのは、募集した人だけです。あなたの名前は送られません。</li>
          <li>ほかの意見に3件以上答えると、あなたの募集のカードに「よく答えている人」の印が付きます。</li>
        </ul>
      </DocSection>

      <DocSection title="登録しないで使う・アカウントを作る">
        <ul>
          <li>登録しなくても、募集を作ったり答えたりできます。このときの募集は、使っているブラウザにだけ残ります。</li>
          <li>
            ほかの端末から意見を見るときは、募集ごとの「自分専用の URL」を使ってください。この URL を知っている人は意見を読めるので、人には送らないでください。
          </li>
          <li>Google・X・GitHub でアカウントを作ると、スマホでもパソコンでも、ログインすれば自分の募集を見られます。登録する前に作った募集や、答えた数もそのまま引き継ぎます。</li>
          <li>アカウントを作ると、これまでに答えた意見を「自分の回答」で見返せます。</li>
          <li>「設定」のプロフィールで表示名を決めておくと、募集するときに自動で入ります。</li>
        </ul>
      </DocSection>

      <DocSection title="やめるとき">
        <p>
          「設定」の画面から、アカウント（登録していない場合は、このブラウザのデータ）を削除できます。作った募集、届いた意見、貼った画像がすべて消え、元に戻せません。
        </p>
      </DocSection>

      <DocSection title="困ったとき">
        <p>
          うまく動かないとき、気になる募集を見つけたときは、運営の X（
          <a href="https://x.com/kinoto_jp" target="_blank" rel="noopener noreferrer" className="font-bold text-coral underline-offset-2 hover:underline">
            @kinoto_jp
          </a>
          ）までお知らせください。
        </p>
      </DocSection>
    </DocPage>
  );
}
