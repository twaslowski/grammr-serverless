"use client";

import React, { createContext, useContext } from "react";
import { Profile } from "@/types/profile";

interface ProfileContextValue {
  profile: Profile;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

interface ProfileProviderProps {
  profile: Profile;
  children: React.ReactNode;
}

export function ProfileProvider({ profile, children }: ProfileProviderProps) {
  return (
    <ProfileContext.Provider value={{ profile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): Profile {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context.profile;
}
