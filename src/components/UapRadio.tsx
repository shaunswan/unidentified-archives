"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Pause, Play, Radio, SkipBack, SkipForward, Volume2 } from "lucide-react";

type RadioTrack = {
  name: string;
  path: string;
  href: string;
};

type RadioContextValue = {
  currentTrack: RadioTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  tracks: RadioTrack[];
  volume: number;
  playPause: () => void;
  playNext: () => void;
  playPrevious: () => void;
  setVolume: (value: number) => void;
};

const RadioContext = createContext<RadioContextValue | null>(null);

export function RadioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentIndexRef = useRef(0);
  const tracksRef = useRef<RadioTrack[]>([]);
  const historyRef = useRef<number[]>([]);
  const autoplayAttemptedRef = useRef(false);
  const [tracks, setTracks] = useState<RadioTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolumeState] = useState(0.2);

  useEffect(() => {
    const audio = new Audio();
    audio.loop = false;
    audio.volume = volume;
    audioRef.current = audio;

    const handleEnded = () => {
      if (tracksRef.current.length === 0) return;
      const nextIndex = pickRandomIndex(currentIndexRef.current);
      void playTrack(nextIndex, true);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);

    return () => {
      audio.pause();
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    tracksRef.current = tracks;
  }, [tracks]);

  useEffect(() => {
    if (tracks.length === 0 || autoplayAttemptedRef.current) return;
    autoplayAttemptedRef.current = true;
    const randomIndex = pickRandomIndex(-1);
    void playTrack(randomIndex, true, true);
  }, [tracks]);

  useEffect(() => {
    let cancelled = false;

    async function loadTracks() {
      try {
        const response = await fetch("/api/radio");
        if (!response.ok) {
          throw new Error(`Failed to load radio playlist (${response.status})`);
        }

        const data = (await response.json()) as { tracks?: RadioTrack[] };
        if (cancelled) return;

        setTracks(data.tracks ?? []);
        setCurrentIndex(0);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setTracks([]);
        setError(err instanceof Error ? err.message : "Failed to load radio playlist");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadTracks();

    return () => {
      cancelled = true;
    };
  }, []);

  function pickRandomIndex(excluding: number) {
    const available = tracksRef.current
      .map((_, index) => index)
      .filter((index) => index !== excluding);

    if (available.length === 0) {
      return excluding >= 0 ? excluding : 0;
    }

    return available[Math.floor(Math.random() * available.length)];
  }

  async function playTrack(index: number, autoplay = true, fromAutoAdvance = false) {
    const audio = audioRef.current;
    const track = tracksRef.current[index];
    if (!audio || !track) return;

    if (!fromAutoAdvance) {
      const current = currentIndexRef.current;
      if (tracksRef.current[current]) {
        historyRef.current = [...historyRef.current, current].slice(-24);
      }
    }

    setCurrentIndex(index);
    audio.src = track.href;
    audio.load();

    if (!autoplay) return;

    try {
      await audio.play();
      setError(null);
    } catch (err) {
      setIsPlaying(false);
      setError(err instanceof Error ? err.message : "Playback blocked");
    }
  }

  function playPause() {
    const audio = audioRef.current;
    if (!audio || tracks.length === 0) return;

    if (audio.src && isPlaying) {
      audio.pause();
      return;
    }

    const nextIndex = tracks[currentIndex] ? currentIndex : pickRandomIndex(-1);
    void playTrack(nextIndex, true);
  }

  function playNext() {
    if (tracks.length === 0) return;
    const nextIndex = pickRandomIndex(currentIndexRef.current);
    void playTrack(nextIndex, true);
  }

  function playPrevious() {
    if (tracks.length === 0) return;
    const previousIndex = historyRef.current.at(-1);

    if (previousIndex == null) {
      const fallbackIndex = pickRandomIndex(currentIndexRef.current);
      void playTrack(fallbackIndex, true);
      return;
    }

    historyRef.current = historyRef.current.slice(0, -1);
    void playTrack(previousIndex, true, true);
  }

  function setVolume(value: number) {
    setVolumeState(value);
    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  }

  const currentTrack = tracks[currentIndex] ?? null;

  return (
    <RadioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isLoading,
        error,
        tracks,
        volume,
        playPause,
        playNext,
        playPrevious,
        setVolume,
      }}
    >
      {children}
    </RadioContext.Provider>
  );
}

export function UapRadioControl() {
  const radio = useRadio();
  const hasTracks = radio.tracks.length > 0;

  return (
    <HoverCard openDelay={80} closeDelay={140}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="group inline-flex items-center gap-2 border border-transparent px-2 py-1 text-[11px] transition-colors hover:border-border hover:bg-card/70"
          aria-label="Open UAP Radio controls"
        >
          <Radio
            className={`h-3.5 w-3.5 ${radio.isPlaying ? "radio-beacon text-accent" : "text-foreground"}`}
          />
          <span className="hidden sm:inline">UAP Radio</span>
        </button>
      </HoverCardTrigger>
      <HoverCardContent
        align="end"
        sideOffset={10}
        className="w-80 border-border bg-card p-0 text-card-foreground paper-edge"
      >
        <div className="border-b border-border/70 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-display text-lg leading-none">UAP Radio</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                In-app transmission loop
              </div>
            </div>
            <div className="rounded-sm border border-border/70 bg-background/70 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
              {radio.tracks.length} tracks
            </div>
          </div>
        </div>

        <div className="space-y-4 px-4 py-4">
          <div
            className="rounded-sm border border-border/70 bg-background/70 p-3"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 20% 20%, oklch(0.78 0.16 62 / 0.12), transparent 70%)",
            }}
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Now transmitting
            </div>
            <div className="mt-2 truncate font-display text-lg leading-tight text-foreground">
              {radio.currentTrack?.name ?? (radio.isLoading ? "Loading playlist" : "No broadcasts loaded")}
            </div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {radio.error
                ? radio.error
                : hasTracks
                  ? radio.isPlaying
                    ? "Live in archive"
                    : "Standing by for random transmission"
                  : "Drop mp3 files into repository/09_UAP_Radio"}
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <RadioButton onClick={radio.playPrevious} disabled={!hasTracks} label="Previous track">
              <SkipBack className="h-4 w-4" />
            </RadioButton>
            <RadioButton onClick={radio.playPause} disabled={!hasTracks} label={radio.isPlaying ? "Pause" : "Play"}>
              {radio.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </RadioButton>
            <RadioButton onClick={radio.playNext} disabled={!hasTracks} label="Next track">
              <SkipForward className="h-4 w-4" />
            </RadioButton>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Volume2 className="h-3.5 w-3.5" />
                Volume
              </span>
              <span>{Math.round(radio.volume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={radio.volume}
              onChange={(event) => radio.setVolume(Number(event.target.value))}
              className="radio-slider w-full accent-[var(--color-accent)]"
              aria-label="UAP Radio volume"
            />
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function RadioButton({
  children,
  disabled,
  label,
  onClick,
}: {
  children: ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-border bg-background/75 text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function useRadio() {
  const context = useContext(RadioContext);
  if (!context) {
    throw new Error("useRadio must be used within a RadioProvider");
  }
  return context;
}
