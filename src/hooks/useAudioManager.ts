import { useState, useEffect, useCallback } from 'react';
import { bgmEngine, PRESET_TRACKS, type BgmTrack } from '../lib/bgmEngine';

export interface AtmosphericTrack extends BgmTrack {
  mood?: string;
  recommendedFor?: string;
}

export const ATMOSPHERIC_TRACKS: AtmosphericTrack[] = [
  {
    ...PRESET_TRACKS[0],
    mood: 'High Focus / Cyberpunk',
    recommendedFor: 'Competitive 1v1 duels & speed sprints',
  },
  {
    ...PRESET_TRACKS[1],
    mood: 'Deep Matrix / Ambient',
    recommendedFor: 'Hard algorithmic problems & graph recursion',
  },
  {
    ...PRESET_TRACKS[2],
    mood: 'Overdrive / High Adrenaline',
    recommendedFor: 'Time-pressured debugging & final minutes',
  },
  {
    ...PRESET_TRACKS[3],
    mood: 'Lo-Fi Chill / Binaural',
    recommendedFor: 'Warmup practice, reading DSA concepts & code review',
  },
];

export interface UseAudioManagerReturn {
  isPlaying: boolean;
  currentTrack: AtmosphericTrack;
  volume: number;
  tracks: AtmosphericTrack[];
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  setTrack: (trackId: string) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  getVisualizerData: (dataArray: Uint8Array) => void;
}

export function useAudioManager(): UseAudioManagerReturn {
  const [isPlaying, setIsPlaying] = useState<boolean>(bgmEngine.getIsPlaying());
  const [currentTrack, setCurrentTrack] = useState<AtmosphericTrack>(() => {
    const track = bgmEngine.getCurrentTrack();
    return (
      ATMOSPHERIC_TRACKS.find(t => t.id === track.id) || ATMOSPHERIC_TRACKS[0]
    );
  });
  const [volume, setVolumeState] = useState<number>(bgmEngine.getVolume());

  useEffect(() => {
    const syncState = () => {
      setIsPlaying(bgmEngine.getIsPlaying());
      const active = bgmEngine.getCurrentTrack();
      const matched =
        ATMOSPHERIC_TRACKS.find(t => t.id === active.id) || {
          ...active,
          mood: 'Atmospheric Coding',
          recommendedFor: 'Deep coding flow',
        };
      setCurrentTrack(matched);
      setVolumeState(bgmEngine.getVolume());
    };

    const unsubscribe = bgmEngine.subscribe(syncState);
    syncState();
    return unsubscribe;
  }, []);

  const play = useCallback(() => {
    bgmEngine.play();
  }, []);

  const pause = useCallback(() => {
    bgmEngine.stop();
  }, []);

  const togglePlay = useCallback(() => {
    bgmEngine.togglePlay();
  }, []);

  const nextTrack = useCallback(() => {
    bgmEngine.nextTrack();
  }, []);

  const prevTrack = useCallback(() => {
    bgmEngine.prevTrack();
  }, []);

  const setTrack = useCallback((trackId: string) => {
    bgmEngine.setTrack(trackId);
  }, []);

  const setVolume = useCallback((vol: number) => {
    bgmEngine.setVolume(vol);
  }, []);

  const toggleMute = useCallback(() => {
    if (bgmEngine.getVolume() > 0) {
      bgmEngine.setVolume(0);
    } else {
      bgmEngine.setVolume(0.4);
    }
  }, []);

  const getVisualizerData = useCallback((dataArray: Uint8Array) => {
    bgmEngine.getVisualizerData(dataArray);
  }, []);

  return {
    isPlaying,
    currentTrack,
    volume,
    tracks: ATMOSPHERIC_TRACKS,
    play,
    pause,
    togglePlay,
    nextTrack,
    prevTrack,
    setTrack,
    setVolume,
    toggleMute,
    getVisualizerData,
  };
}
