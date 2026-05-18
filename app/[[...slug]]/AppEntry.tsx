'use client'

// Inicializa i18next ANTES de montar App (lo hacía main.tsx). Al estar dentro
// del boundary ssr:false, el detector de idioma (navigator/document) solo
// corre en cliente.
import '@/idiomas/configuracionIdiomas'

export { default } from '@/App'
