import { useEffect, useMemo, useState } from "react";
import { PLAYBACK_BASE_SPEED } from "../constants/playback";

export function usePlayback(eventsLength) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  useEffect(() => {
    setPlayIndex(eventsLength);
  }, [eventsLength]);

  useEffect(() => {
    if (!isPlaying || eventsLength === 0) return;

    const timer = setInterval(() => {
      setPlayIndex((current) => {
        if (current >= eventsLength) {
          setIsPlaying(false);
          return eventsLength;
        }
        return current + 1;
      });
    }, PLAYBACK_BASE_SPEED / speedMultiplier);

    return () => clearInterval(timer);
  }, [isPlaying, speedMultiplier, eventsLength]);

  const progressPercent = useMemo(() => {
    if (eventsLength === 0) return 0;
    return (playIndex / eventsLength) * 100;
  }, [playIndex, eventsLength]);

  const reset = () => {
    setIsPlaying(false);
    setPlayIndex(0);
  };

  const stepBack = () => {
    setIsPlaying(false);
    setPlayIndex((current) => Math.max(0, current - 1));
  };

  const stepForward = () => {
    setIsPlaying(false);
    setPlayIndex((current) => Math.min(eventsLength, current + 1));
  };

  

  const jumpToIndex = (nextIndex) => {
    setIsPlaying(false);
    setPlayIndex(Math.max(0, Math.min(eventsLength, nextIndex)));
  };

  return {
    isPlaying,
    setIsPlaying,
    playIndex,
    setPlayIndex,
    speedMultiplier,
    setSpeedMultiplier,
    progressPercent,
    reset,
    stepBack,
    stepForward,
    jumpToIndex,
  };
}