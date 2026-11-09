'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const YOUTUBE_VIDEO_ID = 'BQsLMt-7VJM';

export default function HeroSection() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [videoVisible, setVideoVisible] = useState(false);

  useEffect(() => {
    const sendPlayerCommand = (func: string, args: unknown[] = []) => {
      const win = iframeRef.current?.contentWindow;
      if (!win) return;
      win.postMessage(
        JSON.stringify({
          event: 'command',
          func,
          args,
        }),
        '*'
      );
    };

    const activate720pAutoplay = () => {
      sendPlayerCommand('mute');
      sendPlayerCommand('setPlaybackQuality', ['hd720']);
      sendPlayerCommand('setPlaybackQualityRange', ['hd720', 'hd720']);
      sendPlayerCommand('playVideo');
    };

    const handleMessage = (event: MessageEvent) => {
      if (
        typeof event.origin === 'string' &&
        !event.origin.includes('youtube.com') &&
        !event.origin.includes('youtube-nocookie.com')
      ) {
        return;
      }

      try {
        const data =
          typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (!data) return;

        if (data.event === 'onReady') {
          activate720pAutoplay();
        }

        if (
          data.event === 'infoDelivery' &&
          data.info &&
          typeof data.info.playerState === 'number'
        ) {
          // 1 = PLAYING, 0 = ENDED
          if (data.info.playerState === 1) {
            sendPlayerCommand('setPlaybackQuality', ['hd720']);
            setVideoVisible(true);
          } else if (data.info.playerState === 0) {
            sendPlayerCommand('seekTo', [0, true]);
            sendPlayerCommand('playVideo');
          }
        }
      } catch {
        // Ignore non-JSON postMessages
      }
    };

    window.addEventListener('message', handleMessage);

    const revealTimer = window.setTimeout(() => {
      activate720pAutoplay();
      setVideoVisible(true);
    }, 650);

    const qualityInterval = window.setInterval(() => {
      activate720pAutoplay();
    }, 2500);

    return () => {
      window.removeEventListener('message', handleMessage);
      window.clearTimeout(revealTimer);
      window.clearInterval(qualityInterval);
    };
  }, []);

  const handleIframeLoad = () => {
    const win = iframeRef.current?.contentWindow;
    if (win) {
      win.postMessage(JSON.stringify({ event: 'listening' }), '*');
      win.postMessage(
        JSON.stringify({ event: 'command', func: 'mute', args: [] }),
        '*'
      );
      win.postMessage(
        JSON.stringify({
          event: 'command',
          func: 'setPlaybackQuality',
          args: ['hd720'],
        }),
        '*'
      );
      win.postMessage(
        JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
        '*'
      );
    }
    window.setTimeout(() => {
      setVideoVisible(true);
    }, 350);
  };

  return (
    <section className="hero" id="home">
      <div className="hero-photo" aria-hidden="true">
        <div
          className={`hero-video-wrapper ${
            videoVisible ? 'is-playing' : ''
          }`}
        >
          <iframe
            ref={iframeRef}
            id="bimondo-hero-yt"
            onLoad={handleIframeLoad}
            src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&loop=1&playlist=${YOUTUBE_VIDEO_ID}&modestbranding=1&playsinline=1&rel=0&showinfo=0&vq=hd720&enablejsapi=1`}
            title="Sri Lanka Private Journeys Video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            tabIndex={-1}
          />
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
