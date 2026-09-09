import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import type { AppRole, Profile } from "@/lib/newsroom";

export type CurrentUser = {
  id: string;
  email: string;
  profile: Profile | null;
  role: AppRole;
  isAdmin: boolean;
  displayName: string;
};

export function useCurrentUser() {
  return useQuery<CurrentUser | null>({
    queryKey: ["current-user"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return null;

      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);

      const role: AppRole = roles?.some((entry) => entry.role === "admin") ? "admin" : "editor";

      return {
        id: user.id,
        email: user.email ?? "",
        profile: profile ?? null,
        role,
        isAdmin: role === "admin",
        displayName: profile?.display_name ?? user.email?.split("@")[0] ?? "Team member",
      };
    },
  });
}
