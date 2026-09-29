// Scroll-triggered fade-up using IntersectionObserver.
// Returns a ref to attach to any DOM element.
// Once the element enters the viewport, the 'visible' class is added — never removed,
// so the animation only plays once per page load.
//
// Usage:
//   const ref = useFadeUp()
//   <div ref={ref} className="fade-up-element">...</div>

import { useEffect, useRef } from 'react'

/**
 * @param {number} threshold  – 0–1, how much of the element must be visible (default 0.15)
 * @param {string} rootMargin – IntersectionObserver rootMargin (default '0px 0px -40px 0px')
 */
export function useFadeUp(threshold = 0.15, rootMargin = '0px 0px -40px 0px') {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect prefers-reduced-motion — skip animation entirely
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.opacity = '1'
      el.style.transform = 'none'
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('fade-up-visible')
          observer.unobserve(el) // fire once only
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return ref
}
