'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

type Props = {
  name: string
  email: string
  website?: string | null
  location?: string | null
}

export function Menu({ name, email, website, location }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    document.documentElement.style.overflow = open ? 'hidden' : ''
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const links = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
    { href: '/projects', label: 'Projects' },
    { href: '/stories', label: 'Stories' },
    { href: '/contact', label: 'Contact' },
  ]

  return (
    <>
      <button
        className="menu-button"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={() => setOpen(!open)}
      >
        <span />
        <span />
        <span />
      </button>
      <div id="site-menu" className="menu" data-open={open} inert={!open}>
        <div className="menu-top">
          <div className="container">
            <Link href="/" className="logo">
              {name}
            </Link>
          </div>
        </div>
        <div className="container">
          <nav aria-label="Main">
            <ul>
              {links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    aria-current={pathname === l.href ? 'page' : undefined}
                    onClick={() => setOpen(false)}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="menu-contact">
            {location && <p>{location}</p>}
            <div>
              <a className="underline-link" href={`mailto:${email}`}>
                {email}
              </a>
              {website && (
                <a className="underline-link" href={`https://${website}`}>
                  {website}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
