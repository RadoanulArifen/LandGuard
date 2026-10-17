import { createContext, useContext, useEffect, useState } from 'react'

// Guided "judge demo" state. Keep it across reloads and browser sessions.
const Ctx = createContext(null)
export const useDemo = () => useContext(Ctx)

export function DemoProvider({ children }) {
  const [demo, setDemo] = useState(() => {
    try {
      const saved = localStorage.getItem('lg_demo') ?? sessionStorage.getItem('lg_demo')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  useEffect(() => {
    try {
      if (demo) localStorage.setItem('lg_demo', JSON.stringify(demo))
      else localStorage.removeItem('lg_demo')
      sessionStorage.removeItem('lg_demo')
    } catch { /* ignore */ }
  }, [demo])
  return <Ctx.Provider value={{ demo, start: setDemo, stop: () => setDemo(null) }}>{children}</Ctx.Provider>
}
