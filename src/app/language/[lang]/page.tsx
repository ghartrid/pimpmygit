import { Metadata } from "next";
import { LanguageRepoList } from "@/components/LanguageRepoList";

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const displayLang = decodeURIComponent(lang);
  return {
    title: `Best ${displayLang} Repos - PimpMyGit`,
    description: `Discover and upvote the best ${displayLang} open source repositories on PimpMyGit.`,
  };
}

export default async function LanguagePage({ params }: Props) {
  const { lang } = await params;
  const displayLang = decodeURIComponent(lang);

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">{displayLang} Repositories</h1>
      <p className="mb-6" style={{ color: "var(--text-muted)" }}>
        Top {displayLang} open source projects on PimpMyGit
      </p>
      <LanguageRepoList language={displayLang} />
    </div>
  );
}
