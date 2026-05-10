import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USERNAME: 'dd_username',
  TUTORIAL_DONE: 'dd_tutorial_done',
  GALLERY: 'dd_gallery',
  SPARKS: 'dd_sparks',
  LEVEL_PROGRESS: 'dd_level_progress',
  DAILY_DOODLE: 'dd_daily_doodle',
  STYLE_STARS: 'dd_style_stars',
  ACTIVE_FRAME: 'dd_active_frame',
  OWNED_FRAMES: 'dd_owned_frames',
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

  // Level progression
  async getLevelProgress(): Promise<Record<string, { completed: boolean; bestScore: number }>> {
    const raw = await AsyncStorage.getItem(KEYS.LEVEL_PROGRESS);
    return raw ? JSON.parse(raw) : {};
  },
  async setLevelComplete(sketchbook: number, level: number, bestScore: number): Promise<void> {
    const progress = await Storage.getLevelProgress();
    const key = `${sketchbook}_${level}`;
    const prev = progress[key]?.bestScore || 0;
    progress[key] = { completed: true, bestScore: Math.max(bestScore, prev) };
    return AsyncStorage.setItem(KEYS.LEVEL_PROGRESS, JSON.stringify(progress));
  },

  // Daily Doodle — track which date the user already completed
  async getDailyDoodleDate(): Promise<string | null> { return AsyncStorage.getItem(KEYS.DAILY_DOODLE); },
  async setDailyDoodleDate(date: string): Promise<void> { return AsyncStorage.setItem(KEYS.DAILY_DOODLE, date); },

  // Style Stars — second currency earned from multiplayer votes
  async getStyleStars(): Promise<number> { return parseInt((await AsyncStorage.getItem(KEYS.STYLE_STARS)) || '0', 10); },
  async addStyleStars(amount: number): Promise<void> {
    const current = await Storage.getStyleStars();
    return AsyncStorage.setItem(KEYS.STYLE_STARS, String(current + amount));
  },
  async spendStyleStars(amount: number): Promise<boolean> {
    const current = await Storage.getStyleStars();
    if (current < amount) return false;
    await AsyncStorage.setItem(KEYS.STYLE_STARS, String(current - amount));
    return true;
  },

  // Avatar frames
  async getOwnedFrames(): Promise<string[]> {
    const raw = await AsyncStorage.getItem(KEYS.OWNED_FRAMES);
    return raw ? JSON.parse(raw) : ['default'];
  },
  async unlockFrame(frameId: string): Promise<void> {
    const owned = await Storage.getOwnedFrames();
    if (!owned.includes(frameId)) {
      owned.push(frameId);
      await AsyncStorage.setItem(KEYS.OWNED_FRAMES, JSON.stringify(owned));
    }
  },
  async getActiveFrame(): Promise<string> {
    return (await AsyncStorage.getItem(KEYS.ACTIVE_FRAME)) || 'default';
  },
  async setActiveFrame(frameId: string): Promise<void> {
    return AsyncStorage.setItem(KEYS.ACTIVE_FRAME, frameId);
  },
};
