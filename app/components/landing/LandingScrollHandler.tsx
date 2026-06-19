'use client';

import { useEffect } from 'react';

const SECTION_PARAM_NAMES = ['section', 'scrollTo', 'target'];

function getTargetSectionId(): string | null {
  const params = new URLSearchParams(window.location.search);

  for (const paramName of SECTION_PARAM_NAMES) {
    const value = params.get(paramName)?.trim();

    if (value && /^[a-zA-Z0-9_-]+$/.test(value)) {
      return value;
    }
  }

  return null;
}

export default function LandingScrollHandler() {
  useEffect(() => {
    const targetSectionId = getTargetSectionId();

    if (!targetSectionId) {
      return;
    }

    const scrollToTarget = () => {
      document.getElementById(targetSectionId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    };

    requestAnimationFrame(scrollToTarget);
    const fallbackTimer = window.setTimeout(scrollToTarget, 250);

    return () => window.clearTimeout(fallbackTimer);
  }, []);

  return null;
}
