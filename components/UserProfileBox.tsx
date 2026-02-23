import Link from "next/link";
import { Profile } from "@/lib/profiles";
import BioEditor from "./BioEditor";

interface UserProfileBoxProps {
  profile: Profile;
  variant?: "large" | "compact";
  isOwner?: boolean;
}

export default function UserProfileBox({ profile, variant = "large", isOwner = false }: UserProfileBoxProps) {
  const isLarge = variant === "large";
  const avatarSize = isLarge ? "w-24 h-24 md:w-32 md:h-32" : "w-16 h-16 md:w-20 md:h-20";
  const titleSize = isLarge ? "text-3xl" : "text-xl md:text-2xl";
  const padding = isLarge ? "pb-10 border-b border-border-subtle" : "py-8 mt-12 border-t border-border-subtle";

  return (
    <section className={`flex flex-col md:flex-row items-center md:items-start gap-6 ${padding}`}>
      <Link href={`/@${profile.username}`} className={`${avatarSize} rounded-full overflow-hidden bg-surface flex-shrink-0 border border-border-strong relative group`}>
        {profile.avatar_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={profile.avatar_url}
            alt={profile.username}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-title text-4xl bg-surface/50 group-hover:bg-surface transition-colors">
            {profile.username.charAt(0).toUpperCase()}
          </div>
        )}
      </Link>

      <div className={`flex-1 text-center md:text-left ${!isLarge && 'flex flex-col justify-center min-h-[5rem]'}`}>
        <h2 className={`${titleSize} font-display font-bold mb-1`}>
          <Link href={`/@${profile.username}`} className="hover:text-accent transition-colors">
            {profile.name || profile.username}
          </Link>
        </h2>
        {isLarge && (
          <p className="text-text-tertiary text-sm mb-4">@{profile.username}</p>
        )}
        {isLarge && isOwner ? (
          <BioEditor initialBio={profile.bio || ""} username={profile.username} />
        ) : (
          <p className="text-text-secondary max-w-2xl leading-relaxed whitespace-pre-wrap">
            {profile.bio || "작성자 소개글이 없습니다."}
          </p>
        )}
      </div>
    </section>
  );
}
