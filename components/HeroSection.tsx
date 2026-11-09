'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const YOUTUBE_VIDEO_ID = 'BQsLMt-7VJM';
const PLAYER_BASE_WIDTH = 2560;
const PLAYER_BASE_HEIGHT = 1440;

interface YTPlayerInstance {
  mute: () => void;
  playVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getDuration: () => number;
  getCurrentTime: () => number;
  getPlaybackQuality?: () => string;
  getAvailableQualityLevels?: () => string[];
  setPlaybackQuality?: (suggestedQuality: string) => void;
  setPlaybackQualityRange?: (minQuality: string, maxQuality: string) => void;
  destroy: () => void;
}

interface YTNamespace {
  Player: new (
    element: HTMLElement | string,
    options: {
      width?: number | string;
      height?: number | string;
      videoId: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (event: { target: YTPlayerInstance }) => void;
        onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
        onPlaybackQualityChange?: (event: {
          data: string;
          target: YTPlayerInstance;
        }) => void;
      };
    }
  ) => YTPlayerInstance;
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerMountRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const [videoVisible, setVideoVisible] = useState(false);
  const [ytScale, setYtScale] = useState(1);

  // Dynamically compute exact cover scale for the 2560x1440 player so YouTube ABR sees a 1440p/1080p viewport
  // while the visual frame fits the hero section cleanly without magnifying center pixels.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const scaleX = rect.width / PLAYER_BASE_WIDTH;
      const scaleY = rect.height / PLAYER_BASE_HEIGHT;
      // 1.08 bleed factor crops any subtle edge artifacts while preserving the full 1080p drone vista
      const coverScale = Math.max(scaleX, scaleY) * 1.08;
      setYtScale(coverScale);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    window.addEventListener('resize', updateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    let revealTimeout: number | undefined;
    let loopCheckInterval: number | undefined;

    const forceHighResolution = (player: YTPlayerInstance) => {
      try {
        const available = player.getAvailableQualityLevels?.() || [];
        const preferredOrder = ['hd2160', 'hd1440', 'hd1080', 'highres'];
        const bestQuality =
          preferredOrder.find((q) => available.includes(q)) || 'hd1080';

        if (typeof player.setPlaybackQualityRange === 'function') {
          player.setPlaybackQualityRange('hd1080', bestQuality);
        }
        if (typeof player.setPlaybackQuality === 'function') {
          player.setPlaybackQuality(bestQuality);
        }
      } catch {
        // Ignore if player is not yet ready
      }
    };

    const initPlayer = () => {
      if (!isMounted || !playerMountRef.current || !window.YT?.Player) return;

      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore destroy error
        }
      }

      playerRef.current = new window.YT.Player(playerMountRef.current, {
        width: PLAYER_BASE_WIDTH,
        height: PLAYER_BASE_HEIGHT,
        videoId: YOUTUBE_VIDEO_ID,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          showinfo: 0,
          vq: 'hd1080',
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event) => {
            if (!isMounted) return;
            const player = event.target;
            player.mute();
            forceHighResolution(player);
            player.playVideo();

            // Monitor loop & keep quality locked at 1080p+ without triggering HUD
            loopCheckInterval = window.setInterval(() => {
              try {
                const currentQ = player.getPlaybackQuality?.();
                if (
                  currentQ &&
                  currentQ !== 'hd1080' &&
                  currentQ !== 'hd1440' &&
                  currentQ !== 'hd2160' &&
                  currentQ !== 'highres'
                ) {
                  forceHighResolution(player);
                }

                const duration = player.getDuration?.() || 0;
                const currentTime = player.getCurrentTime?.() || 0;
                if (duration > 2 && currentTime >= duration - 1.0) {
                  player.seekTo(0, true);
                  player.playVideo();
                }
              } catch {
                // Ignore transient errors
              }
            }, 400);
          },
          onStateChange: (event) => {
            if (!isMounted) return;
            const player = event.target;
            // 3 = BUFFERING, 1 = PLAYING, 2 = PAUSED, 0 = ENDED
            if (event.data === 3 || event.data === -1) {
              forceHighResolution(player);
            } else if (event.data === 1) {
              forceHighResolution(player);
              window.clearTimeout(revealTimeout);
              revealTimeout = window.setTimeout(() => {
                if (isMounted) setVideoVisible(true);
              }, 950);
            } else if (event.data === 2) {
              setVideoVisible(false);
              player.playVideo();
            } else if (event.data === 0) {
              player.seekTo(0, true);
              player.playVideo();
            }
          },
          onPlaybackQualityChange: (event) => {
            const q = event.data;
            if (
              q !== 'hd1080' &&
              q !== 'hd1440' &&
              q !== 'hd2160' &&
              q !== 'highres'
            ) {
              forceHighResolution(event.target);
            }
          },
        },
      });
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const existingScript = document.querySelector(
        'script[src="https://www.youtube.com/iframe_api"]'
      );
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        tag.async = true;
        document.head.appendChild(tag);
      }

      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevCallback === 'function') prevCallback();
        initPlayer();
      };
    }

    return () => {
      isMounted = false;
      window.clearTimeout(revealTimeout);
      window.clearInterval(loopCheckInterval);
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore destroy errors
        }
        playerRef.current = null;
      }
    };
  }, []);

  return (
    <section className="hero" id="home">
      <div className="hero-photo" ref={containerRef} aria-hidden="true">
        <div
          className={`hero-video-wrapper ${videoVisible ? 'is-playing' : ''}`}
          style={
            {
              '--yt-scale': ytScale,
            } as React.CSSProperties
          }
        >
          <div ref={playerMountRef} id="bimondo-hero-yt" />
        </div>
      </div>

      <div className="wrap hero-inner">
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow">
            AYUBOWAN · PRIVATE JOURNEYS IN SRI LANKA
          </div>
          <h1 className="serif">
            A little{' '}
            <span className="island-word">
              island<span className="period">.</span>
            </span>
            <br />
            <em>A lifetime</em>
            <br />
            <span className="stories-word">
              of stories<span className="period">.</span>
            </span>
          </h1>
          <p>
            Not a checklist. Not a crowded tour bus. Just your own Sri Lanka —
            its warm people, ancient wonders and unforgettable little moments.
          </p>
          <div className="hero-actions">
            <Link className="pill dark" href="/journeys">
              EXPLORE OUR JOURNEYS ↗
            </Link>
            <Link className="pill" href="/our-story">
              MEET BIMONDO ↓
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
