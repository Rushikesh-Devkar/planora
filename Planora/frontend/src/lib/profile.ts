import { useEffect, useState } from "react";

export interface Profile {
  name: string;
  email: string;
}

const KEY = "planora-settings";
const DEFAULT: Profile = { name: "Rushikesh", email: "demo@planora.local" };

export function getProfile(): Profile {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw);
    return {
      name: parsed.name?.trim() || DEFAULT.name,
      email: parsed.email?.trim() || DEFAULT.email,
    };
  } catch {
    return DEFAULT;
  }
}

export function saveProfile(profile: Profile) {
  localStorage.setItem(KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event("planora:profile"));
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "P";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(getProfile);

  useEffect(() => {
    const update = () => setProfile(getProfile());
    window.addEventListener("planora:profile", update);
    return () => window.removeEventListener("planora:profile", update);
  }, []);

  return profile;
}
