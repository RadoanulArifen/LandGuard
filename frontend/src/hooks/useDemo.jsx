import { createContext, useContext, useEffect, useState } from 'react'

// Guided "judge demo" state. Kept in sessionStorage so it survives page reloads.
const Ctx = createContext(null)
export const useDemo = () => useContext(Ctx)

export function DemoProvider({ children }) {
  const [demo, setDemo] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('lg_demo')) } catch { return null }
  })
  useEffect(() => {
    try { demo ? sessionStorage.setItem('lg_demo', JSON.stringify(demo)) : sessionStorage.removeItem('lg_demo') } catch { /* ignore */ }
  }, [demo])
  return <Ctx.Provider value={{ demo, start: setDemo, stop: () => setDemo(null) }}>{children}</Ctx.Provider>
}
