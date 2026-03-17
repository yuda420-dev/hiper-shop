import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { onAuthStateChange, signOut } from '../services/auth';
import { getUserProfile } from '../services/database';

/**
 * Auth hook for HiPeR Gallery.
 * Manages Supabase auth state and the user's profile from the `profiles` table.
 */
export const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        setIsLoggedIn(true);

        try {
          const profileData = await getUserProfile(session.user.id);
          setProfile(profileData);
        } catch (err) {
          console.error('Error loading user profile:', err);
        }
      } else {
        setUser(null);
        setProfile(null);
        setIsLoggedIn(false);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (isSupabaseConfigured()) {
      await signOut();
    } else {
      setUser(null);
      setProfile(null);
      setIsLoggedIn(false);
    }
  };

  return {
    isLoggedIn,
    user,
    profile,
    loading,
    handleLogout,
    setProfile,
  };
};
