/**
 * @file useBodyScrollLock.js
 * @description Custom React hook to reliably lock body scrolling when a modal or drawer is open.
 */
import { useEffect } from 'react';
import { lockScroll, unlockScroll } from '@/utils/scrollLock';

export function useBodyScrollLock(isLocked = true) {
  useEffect(() => {
    if (!isLocked) return;

    lockScroll();

    return () => {
      unlockScroll();
    };
  }, [isLocked]);
}

export default useBodyScrollLock;
