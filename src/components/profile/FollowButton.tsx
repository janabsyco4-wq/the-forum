"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, UserPlus } from "lucide-react";
import { api } from "@/lib/api/client";
import { href } from "@/i18n/config";
import { useI18n } from "@/components/providers/I18nProvider";
import { ActionNotice, toActionState, type ActionState } from "@/components/ui/ActionNotice";

/** Follow / unfollow toggle. Signed-out visitors are sent to sign in first. */
export function FollowButton({ userId, initialFollowing = false, signedIn = true }: { userId: string; initialFollowing?: boolean; signedIn?: boolean }) {
  const { dict, locale } = useI18n();
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [state, setState] = useState<ActionState>({ kind: "idle" });
  return (
    <div className="relative">
      <button
        type="button"
        disabled={state.kind === "pending"}
        aria-pressed={following}
        className={`btn w-full ${following ? "btn-outline" : "btn-primary"}`}
        onClick={async () => {
          if (!signedIn) return router.push(`${href(locale, "/login")}?next=${encodeURIComponent(location.pathname)}`);
          setState({ kind: "pending" });
          const res = await api("POST /api/users/:id/follow", undefined, { id: userId });
          if (res.ok) {
            setFollowing(res.data.following);
            setState({ kind: "idle" });
            router.refresh(); // follower count on the profile
          } else setState(toActionState(res, ""));
        }}
      >
        {following ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
        {following ? dict.common.following : dict.common.follow}
      </button>
      {state.kind !== "idle" && state.kind !== "pending" && (
        <div className="absolute end-0 top-12 z-10 w-72">
          <ActionNotice state={state} />
        </div>
      )}
    </div>
  );
}
