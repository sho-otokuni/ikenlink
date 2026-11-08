import type { Metadata } from "next";
import Link from "next/link";

import { DocPage, DocSection } from "@/components/DocPage";

export const metadata: Metadata = {
  title: "使い方｜意見リンク",
  description: "意見リンクの使い方。意見を募集する方と、回答する方のための説明です。",
};

const linkClass = "font-bold text-coral underline-offset-2 hover:underline";

/** 使い方 */
export default function GuidePage() {
  return (
    <DocPage
      title="使い方"
      lead={
        <p>
          意見リンクは、アイデアや制作中のもの、公開済みのサービスなどについて、意見を募集できるサービスです。
          画像や URL を添えて募集を作成すると、回答を受け付けるためのリンクが発行されます。
        </p>
      }
    >
      <DocSection title="意見を募集する">
        <ol>
          <li>
            <Link href="/new" className={linkClass}>
              意見を募集する
            </Link>
            画面を開きます。
          </li>
          <li>見てほしいものの種類（アプリ・サービス、アイデア、デザイン、文章、そのほか）を選び、タイトルを入力します。</li>
          <li>必要に応じて、画像（4枚まで）、説明、URL（5件まで）を追加します。画像にはそれぞれタイトルを付けられます。</li>
          <li>聞きたいことを設定します（詳しくは「質問の設定」をご覧ください）。</li>
          <li>締め切り、公開範囲、表示名を設定し、「募集を始める」を押します。</li>
        </ol>
        <p>発行されたリンクは、コピーするほか、X や LINE で共有できます。</p>
      </DocSection>

      <DocSection title="質問の設定">
        <ul>
          <li>はじめは「あなたの意見をお聞かせください」の1問が設定されています。質問文は自由に変更できます。</li>
          <li>「＋ 質問を追加」から、質問を5問まで追加できます。</li>
          <li>質問ごとに、自由入力、選択式（1つ選択）、選択式（複数選択）のいずれかを選べます。選択式の場合は、選択肢（2〜6個）を入力します。</li>
          <li>「よく使われる質問」を押すと、質問文と選択肢が入力された状態で追加されます。追加したあとに内容を変更できます。</li>
          <li>回答はすべて任意です。回答者は答えたい質問だけに回答できます。</li>
        </ul>
      </DocSection>

      <DocSection title="公開範囲と締め切り">
        <ul>
          <li>
            <b>公開（誰でも回答可）</b>：
            <Link href="/list" className={linkClass}>
              みんなの募集
            </Link>
            に掲載され、どなたでも回答できます。
          </li>
          <li>
            <b>非公開（リンクを知っている人だけ）</b>：一覧には掲載されず、リンクを受け取った方のみが回答できます。
          </li>
          <li>いずれの場合も、届いた意見を閲覧できるのは募集した方のみです。</li>
          <li>締め切りを過ぎると回答を受け付けなくなり、一覧にも表示されなくなります。</li>
          <li>公開範囲と締め切りは、届いた意見の画面からいつでも変更できます。</li>
        </ul>
      </DocSection>

      <DocSection title="届いた意見を確認する">
        <ul>
          <li>
            <Link href="/me" className={linkClass}>
              マイページ
            </Link>
            の「募集」から、作成した募集と届いた意見を確認できます。
          </li>
          <li>届いた意見は、「質問ごと」と「回答者ごと」の2つの表示を切り替えて確認できます。回答者の名前は表示されません。</li>
          <li>「編集する」から募集の内容を変更できます。ただし、意見が届いたあとは、回答との対応を保つため質問は変更できません。</li>
          <li>X などで共有すると、タイトルと1枚目の画像を含むカードが表示されます。</li>
        </ul>
      </DocSection>

      <DocSection title="回答する">
        <ul>
          <li>
            届いたリンク、または
            <Link href="/list" className={linkClass}>
              みんなの募集
            </Link>
            から募集を開くと、登録せずにそのまま回答できます。
          </li>
          <li>回答を閲覧できるのは募集した方のみです。回答者の名前は送信されません。</li>
          <li>他の募集に3件以上回答すると、ご自身の募集のカードに「よく答えている人」の印が付きます。</li>
        </ul>
      </DocSection>

      <DocSection title="アカウント">
        <ul>
          <li>アカウントを登録しなくても、募集の作成と回答はご利用いただけます。この場合、作成した募集はご利用中のブラウザにのみ保存されます。</li>
          <li>登録せずに作成した募集を他の端末から確認するには、募集ごとに発行される「管理用 URL」をご利用ください。この URL を知っている人は意見を閲覧できるため、第三者には共有しないでください。</li>
          <li>
            Google、X、GitHub のいずれかのアカウントで
            <Link href="/signup" className={linkClass}>
              アカウント登録
            </Link>
            を行うと、他の端末からもログインして募集を確認できます。登録前に作成した募集と回答数は、そのまま引き継がれます。
          </li>
          <li>アカウントを登録すると、マイページの「回答」で、これまでの回答を確認できます。</li>
          <li>表示名はマイページの「名前を変更」から変更できます。設定した表示名は、募集を作成するときに自動で入力されます。</li>
        </ul>
      </DocSection>

      <DocSection title="データの削除">
        <p>
          「設定」の画面から、アカウント（登録していない場合は、このブラウザのデータ）を削除できます。作成した募集、届いた意見、投稿した画像はすべて削除され、元に戻すことはできません。
        </p>
      </DocSection>

      <DocSection title="お問い合わせ">
        <p>
          不具合のご報告や、不適切な募集のご連絡は、X（
          <a href="https://x.com/kinoto_jp" target="_blank" rel="noopener noreferrer" className={linkClass}>
            @kinoto_jp
          </a>
          ）までお寄せください。
        </p>
      </DocSection>
    </DocPage>
  );
}
