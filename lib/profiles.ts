import { supabase } from "./supabase";

export interface Profile {
  id: string; // uuid
  username: string; // github login
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  updated_at: string;
}

export async function upsertProfile(profile: Partial<Profile> & { id: string, username: string }) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: profile.id,
      username: profile.username,
      name: profile.name,
      avatar_url: profile.avatar_url,
      updated_at: new Date().toISOString()
    }, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error("Error upserting profile:", error);
    return null;
  }
  return data as Profile;
}

export async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !data) {
    return null;
  }
  return data as Profile;
}
