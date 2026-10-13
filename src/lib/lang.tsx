import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_LANG, DICTS, LANGS, type Dict, type Lang } from '../i18n'

const KEY = 'ssc-lang'
interface Ctx { lang: Lang; t: Dict; setLang: (l: Lang) => void }
const LangCtx = createContext<Ctx>(null as unknown as Ctx)

function initial(): Lang {
  try {
    const s = localStorage.getItem(KEY) as Lang | null
    if (s && DICTS[s]) return s
  } catch { /* storage blocked */ }
  return DEFAULT_LANG
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial)
  useEffect(() => {
    const meta = LANGS.find((l) => l.code === lang)!
    document.documentElement.lang = meta.htmlLang
    document.title = DICTS[lang].meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', DICTS[lang].meta.description)
  }, [lang])
  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { localStorage.setItem(KEY, l) } catch { /* ignore */ }
  }, [])
  const value = useMemo(() => ({ lang, t: DICTS[lang], setLang }), [lang, setLang])
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>
}
export const useLang = () => useContext(LangCtx)

export function useMoney() {
  const { lang } = useLang()
  return useCallback(
    (n: number) => new Intl.NumberFormat(LANGS.find((l) => l.code === lang)!.htmlLang, { style: 'currency', currency: CURRENCY_CODE }).format(n),
    [lang],
  )
}
import { CURRENCY } from '../config'
const CURRENCY_CODE = CURRENCY.code
