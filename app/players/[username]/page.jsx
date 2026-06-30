import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRight, Trophy } from "lucide-react";

import { PlayerCardDisplay } from "@/components/player-card-display";
import { Button } from "@/components/ui/button";
import { getPlayerRating } from "@/lib/player-card";
import { getPublicPlayerCard } from "@/lib/server/player-card";

export async function generateMetadata({ params }) {
  const { username } = await params;
  const card = await getPublicPlayerCard(username);
  if (!card) return { title: "Player not found | SoccerSesh" };

  const rating = getPlayerRating(card.stats);
  const title = `${card.user.name}'s player card | SoccerSesh`;
  const description = `@${card.user.username} is rated ${rating} with ${card.stats.goals} goals, ${card.stats.assists} assists, and ${card.stats.wins} wins.`;
  const url = `/players/${card.user.username}`;
  const imageUrl = `${url}/opengraph-image`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      type: "profile",
      url,
      siteName: "SoccerSesh",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${card.user.name}'s SoccerSesh player card`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function PublicPlayerPage({ params }) {
  const { username } = await params;
  const card = await getPublicPlayerCard(username);
  if (!card) notFound();

  return (
    <main className="min-h-screen bg-[#171517] text-white">
      <header className="border-b border-black/10 bg-black/20">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center">
            <Image
              src="/Logo.png"
              alt="SoccerSesh"
              width={144}
              height={40}
              className="h-30 w-auto object-contain"
              priority
            />
          </Link>
          <Button asChild size="sm">
            <Link href="/signup">
              Join SoccerSesh
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-65px)] max-w-5xl items-center gap-8 px-4 py-10 md:grid-cols-[minmax(280px,380px)_1fr]">
        <PlayerCardDisplay
          user={card.user}
          stats={card.stats}
          className="mx-auto"
        />
        <div className="text-center md:text-left">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-primary">
            SoccerSesh player
          </p>
          <h1 className="mt-3 text-4xl font-black">{card.user.name}</h1>
          <p className="mt-1 text-lg font-bold text-white/60">
            @{card.user.username}
          </p>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/70">
            Track your matches, goals, assists, wins, and ranking. Your player
            card upgrades as completed match stats are recorded.
          </p>
          <Button asChild className="mt-7">
            <Link href="/signup">
              <Trophy />
              Create your player card
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
