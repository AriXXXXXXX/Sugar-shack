import '@fontsource/anton/400.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/noto-sans-thai/400.css'
import '@fontsource/noto-sans-thai/800.css'
import '@fontsource/noto-sans-sc/400.css'
import '@fontsource/noto-sans-sc/800.css'
import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import gsap from 'gsap'
import App from './App'

gsap.ticker.lagSmoothing(0) // keep animations time-based on slow devices

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
