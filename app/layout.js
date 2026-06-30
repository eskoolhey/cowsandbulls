import './globals.css'

export const metadata = {
  title: 'Cows & Bulls',
  description: 'A number guessing game of logic and deduction — play solo or challenge a friend online',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
