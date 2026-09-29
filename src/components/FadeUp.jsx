// Scroll-triggered fade-up wrapper component.
// Wraps any children in a div that animates in when it enters the viewport.
//
// Props:
//   as        — HTML tag to render (default 'div')
//   delay     — CSS transition-delay in ms, e.g. 100 / 200 / 300
//   threshold — how much of the element must be visible before triggering (default 0.15)
//   className — extra classes to forward to the wrapper element
//   style     — inline styles to forward
//
// Example:
//   <FadeUp><h2>Judul Section</h2></FadeUp>
//   <FadeUp delay={200} as="section">...</FadeUp>

import { useFadeUp } from '../hooks/useFadeUp'

export default function FadeUp({
  as: Tag = 'div',
  delay,
  threshold,
  className = '',
  style,
  children,
  ...rest
}) {
  const ref = useFadeUp(threshold)

  const delayStyle = delay ? { transitionDelay: `${delay}ms` } : {}

  return (
    <Tag
      ref={ref}
      className={`fade-up-element ${className}`}
      style={{ ...delayStyle, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  )
}
