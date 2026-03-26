import { supabaseAdmin as supabase } from "./supabase-admin";
import { cache } from "react";

export interface Profile {
  id: string; // NextAuth user.id (Text)
  username: string;
  email?: string | null;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  stripe_customer_id?: string | null; // 감사 목적 보존
  portone_billing_key?: string | null;
  billing_cycle?: 'monthly' | 'yearly' | null;
  subscription_tier?: 'free' | 'pro' | 'business';
  subscription_status?: string;
  usage_count_month?: number;
  usage_reset_date?: string;
  role?: string;
  updated_at: string;
}

/**
 * 기존 프로필의 id를 GitHub numeric ID로 마이그레이션합니다.
 * username으로 기존 행을 찾아 id가 다르면 업데이트합니다.
 * @returns 마이그레이션 성공 여부 (이미 일치하면 true 반환)
 */
export async function migrateProfileId(username: string, newId: string): Promise<boolean> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .single();

  if (!existing) return false; // 프로필 없음 → 새로 생성 필요
  if (existing.id === newId) return true; // 이미 일치

  const { error } = await supabase
    .from("profiles")
    .update({ id: newId, updated_at: new Date().toISOString() })
    .eq("username", username);

  if (error) {
    console.error("Profile ID migration failed:", error);
    return false;
  }
  return true;
}

export async function upsertProfile(profile: Partial<Profile> & { id: string, username: string }) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: profile.id,
      username: profile.username,
      name: profile.name,
      avatar_url: profile.avatar_url, role: profile.role,
      email: profile.email,
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

export const getProfileByUsername = cache(async function getProfileByUsername(username: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (error || !data) {
    return null;
  }
  return data as Profile;
});

export async function updateBio(username: string, bio: string): Promise<boolean> {
  const { error } = await supabase
    .from("profiles")
    .update({ bio, updated_at: new Date().toISOString() })
    .eq("username", username);

  if (error) {
    console.error("Error updating bio:", error);
    return false;
  }
  return true;
}


export async function getAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching all profiles:', error);
    return [];
  }
  return data as Profile[];
}

