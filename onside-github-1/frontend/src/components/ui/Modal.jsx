import { useEffect } from 'react'

export function Modal({ onClose, children }) {
  useEffect(() => {
    const handleKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="glass-primary relative flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white/90"
        >
          ✕
        </button>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}
