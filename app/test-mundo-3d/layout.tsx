import { Montserrat, Nunito, Raleway } from 'next/font/google'

// El duelo del Mundo 3D embebe la pantalla de AcordeonProMax (ModoJuego). Como esta ruta vive FUERA del
// layout de /acordeon-pro-max, Next NO incluía las hojas del simulador en su bundle (y los imports en la
// page 'use client' no cargaban fiable) → la pantalla del duelo salía sin estilos. Este layout (server
// component) IMPORTA ese CSS y aplica las MISMAS fuentes que el layout admin → estilos idénticos al
// simulador real. Los CSS están scopeados por clase (.promax-*, .competitivo-modo, .hero-*) → no afectan
// al resto del mundo.
import '../../src/Paginas/AcordeonProMax/Modos/_BaseSimulador.css'
import '../../src/Paginas/AcordeonProMax/Modos/ModoCompetitivo.css'
import '../../src/Paginas/AcordeonProMax/Modos/ModoLibre.css'
import '../../src/Core/componentes/CuerpoAcordeon.css'
import '../../src/Paginas/AcordeonProMax/Componentes/HeaderHero.css'
import '../../src/Paginas/AcordeonProMax/Componentes/PantallaPreJuegoProMax.css'
import '../../src/Paginas/AcordeonProMax/Componentes/PantallaResultados.css'
import '../../src/Paginas/AcordeonProMax/Componentes/PantallaGameOverProMax.css'

const montserrat = Montserrat({ subsets: ['latin'], weight: ['900'], display: 'swap', variable: '--font-montserrat' })
const nunito = Nunito({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-nunito' })
const raleway = Raleway({ subsets: ['latin'], weight: ['400', '600', '700'], display: 'swap', variable: '--font-raleway' })

export default function TestMundo3DLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${montserrat.variable} ${nunito.variable} ${raleway.variable}`}>
      {children}
    </div>
  )
}
