import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USERNAME: 'dd_username',
  TUTORIAL_DONE: 'dd_tutorial_done',
  GALLERY: 'dd_gallery',
  SPARKS: 'dd_sparks',
};

export type GalleryEntry = {
  id: string;
  prompt: string;
  svgData: string;      // serialized strokes as JSON
  createdAt: string;
  aiScore?: number;
  aiFeedback?: string;
};

export const Storage = {
  async getUsername(): Promise<string | null> { return AsyncStorage.getItem(KEYS.USERNAME); },
  async setUsername(name: string): Promise<void> { return AsyncStorage.setItem(KEYS.USERNAME, name); },
  async isTutorialDone(): Promise<boolean> { return (await AsyncStorage.getItem(KEYS.TUTORIAL_DONE)) === 'true'; },
  async setTutorialDone(): Promise<void> { return AsyncStorage.setItem(KEYS.TUTORIAL_DONE, 'true'); },
  async getGallery(): Promise<GalleryEntry[]> {
    const raw = await AsyncStorage.getItem(KEYS.GALLERY);
    return raw ? JSON.parse(raw) : [];
  },
  async addToGallery(entry: GalleryEntry): Promise<void> {
    const gallery = await Storage.getGallery();
    gallery.unshift(entry);
    return AsyncStorage.setItem(KEYS.GALLERY, JSON.stringify(gallery.slice(0, 50)));
  },
  async updateGalleryEntry(id: string, updates: Partial<GalleryEntry>): Promise<void> {
    const gallery = await Storage.getGallery();
    const idx = gallery.findIndex(e => e.id === id);
    if (idx !== -1) { gallery[idx] = { ...gallery[idx], ...updates }; }
    return AsyncStorage.setItem(KEYS.GALLERY, JSON.stringify(gallery));
  },
  async getSparks(): Promise<number> { return parseInt((await AsyncStorage.getItem(KEYS.SPARKS)) || '0', 10); },
  async addSparks(amount: number): Promise<void> {
    const current = await Storage.getSparks();
    return AsyncStorage.setItem(KEYS.SPARKS, String(current + amount));
  },
};
