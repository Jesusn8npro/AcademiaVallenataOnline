import { Montserrat, Nunito, Raleway } from 'next/font/google'

const montserrat = Montserrat({ subsets: ['latin'], weight: ['900'], display: 'swap', variable: '--font-montserrat' })
const nunito = Nunito({ subsets: ['latin'], weight: ['400', '700'], display: 'swap', variable: '--font-nunito' })
const raleway = Raleway({ subsets: ['latin'], weight: ['400', '600', '700'], display: 'swap', variable: '--font-raleway' })

export default function AcordeonProMaxLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${montserrat.variable} ${nunito.variable} ${raleway.variable}`}>
      {children}
    </div>
  )
}
