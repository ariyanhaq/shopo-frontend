/**
 * @file scrollLock.js
 * @description Bulletproof body scroll lock using position-fixed pinning and scrollbar compensation.
 * Prevents desktop mousewheel, Mac trackpad momentum, and mobile touch background scrolling.
 */

let activeLockCount = 0;
let lockedScrollY = 0;
let previousStyles = null;

function getScrollbarWidth() {
  if (typeof window === 'undefined') return 0;
  return window.innerWidth - document.documentElement.clientWidth;
}

function handleWheelBackdrop(e) {
  // If wheel event target is not within a scrollable element in a modal, prevent it
  const target = e.target;
  if (!target) return;
  const isScrollable = target.closest(
    '.overflow-y-auto, .overflow-auto, [data-modal-scrollable], textarea, input'
  );
  if (!isScrollable) {
    e.preventDefault();
  }
}

function handleTouchMoveBackdrop(e) {
  const target = e.target;
  if (!target) return;
  const isScrollable = target.closest(
    '.overflow-y-auto, .overflow-auto, [data-modal-scrollable], textarea, input'
  );
  if (!isScrollable) {
    e.preventDefault();
  }
}

export function lockScroll() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  activeLockCount += 1;

  if (activeLockCount === 1) {
    lockedScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
    const scrollbarWidth = getScrollbarWidth();

    // Cache previous styles to restore cleanly later
    previousStyles = {
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyLeft: document.body.style.left,
      bodyWidth: document.body.style.width,
      bodyOverflow: document.body.style.overflow,
      bodyPaddingRight: document.body.style.paddingRight,
      htmlOverflow: document.documentElement.style.overflow,
    };

    // 1. Add CSS class markers
    document.documentElement.classList.add('modal-open');
    document.body.classList.add('modal-open');

    // 2. Lock html and body overflow
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // 3. Pin body position to freeze background at exact scroll position
    document.body.style.position = 'fixed';
    document.body.style.top = `-${lockedScrollY}px`;
    document.body.style.left = '0px';
    document.body.style.width = '100%';

    // 4. Compensate scrollbar width to prevent page jump
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // 5. Prevent touchmove/wheel leakage to background on non-scrollable parts of the modal
    window.addEventListener('wheel', handleWheelBackdrop, { passive: false });
    window.addEventListener('touchmove', handleTouchMoveBackdrop, { passive: false });
  }
}

export function unlockScroll() {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  activeLockCount = Math.max(0, activeLockCount - 1);

  if (activeLockCount === 0) {
    // 1. Remove event listeners
    window.removeEventListener('wheel', handleWheelBackdrop);
    window.removeEventListener('touchmove', handleTouchMoveBackdrop);

    // 2. Remove CSS class markers
    document.documentElement.classList.remove('modal-open');
    document.body.classList.remove('modal-open');

    // 3. Restore styles
    if (previousStyles) {
      document.documentElement.style.overflow = previousStyles.htmlOverflow || '';
      document.body.style.overflow = previousStyles.bodyOverflow || '';
      document.body.style.position = previousStyles.bodyPosition || '';
      document.body.style.top = previousStyles.bodyTop || '';
      document.body.style.left = previousStyles.bodyLeft || '';
      document.body.style.width = previousStyles.bodyWidth || '';
      document.body.style.paddingRight = previousStyles.bodyPaddingRight || '';
      previousStyles = null;
    } else {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.width = '';
      document.body.style.paddingRight = '';
    }

    // 4. Restore exact scroll offset
    window.scrollTo(0, lockedScrollY);
  }
}

export function forceUnlockScroll() {
  activeLockCount = 0;
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  window.removeEventListener('wheel', handleWheelBackdrop);
  window.removeEventListener('touchmove', handleTouchMoveBackdrop);

  document.documentElement.classList.remove('modal-open');
  document.body.classList.remove('modal-open');

  if (previousStyles) {
    document.documentElement.style.overflow = previousStyles.htmlOverflow || '';
    document.body.style.overflow = previousStyles.bodyOverflow || '';
    document.body.style.position = previousStyles.bodyPosition || '';
    document.body.style.top = previousStyles.bodyTop || '';
    document.body.style.left = previousStyles.bodyLeft || '';
    document.body.style.width = previousStyles.bodyWidth || '';
    document.body.style.paddingRight = previousStyles.bodyPaddingRight || '';
    previousStyles = null;
  } else {
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.width = '';
    document.body.style.paddingRight = '';
  }

  window.scrollTo(0, lockedScrollY);
}

export function isScrollLocked() {
  return activeLockCount > 0;
}
