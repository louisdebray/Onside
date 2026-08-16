import { useEffect, useRef, useState } from 'react'

export function FlashValue({ value, className, as: Tag = 'span' }) {
  const [flash, setFlash] = useState(false)
  const prevValue = useRef(value)

  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value
      setFlash(true)
      const timeout = setTimeout(() => setFlash(false), 700)
      return () => clearTimeout(timeout)
    }
  }, [value])

  return (
    <Tag className={`${className || ''} rounded-md px-0.5 ${flash ? 'animate-flash-update' : ''}`}>
      {value}
    </Tag>
  )
}
