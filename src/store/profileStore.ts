import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { useAuthStore } from './authStore';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

interface ProfileState {
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  notificationsEnabled: boolean;
  loading: boolean;
  saving: boolean;
  fetchProfile: () => Promise<void>;
  updateProfile: (first: string, last: string) => Promise<void>;
  uploadAvatar: (imageUri: string) => Promise<void>;
  updateNotificationSettings: (enabled: boolean) => Promise<void>;
  savePushToken: (token: string) => Promise<void>;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  firstName: '',
  lastName: '',
  avatarUrl: null,
  notificationsEnabled: true,
  loading: false,
  saving: false,

  fetchProfile: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, avatar_url, notifications_enabled')
        .eq('id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        set({
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          avatarUrl: data.avatar_url,
          notificationsEnabled: data.notifications_enabled ?? true,
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (first: string, last: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ saving: true });
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        first_name: first.trim(),
        last_name: last.trim(),
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      set({ firstName: first.trim(), lastName: last.trim() });
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      set({ saving: false });
    }
  },

  uploadAvatar: async (imageUri: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ saving: true });
    try {
      const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
      const filePath = `${user.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(base64), { contentType: 'image/jpeg', upsert: true });
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
      set({ avatarUrl: publicUrl });
    } catch (error) {
      console.log(error);
      throw error;
    } finally {
      set({ saving: false });
    }
  },

  updateNotificationSettings: async (enabled: boolean) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ notificationsEnabled: enabled });
    try {
      await supabase.from('profiles').update({ notifications_enabled: enabled }).eq('id', user.id);
    } catch (error) {
      set({ notificationsEnabled: !enabled });
      console.error(error);
    }
  },

  savePushToken: async (token: string) => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    try {
      await supabase.from('profiles').update({ push_token: token }).eq('id', user.id);
    } catch (error) {
      console.error(error);
    }
  },

  clearProfile: () => {
    set({ firstName: '', lastName: '', avatarUrl: null, notificationsEnabled: true });
  },
}));
