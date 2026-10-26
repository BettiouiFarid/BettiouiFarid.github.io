import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="not-found container">
      <h1 className="display">404</h1>
      <p>This page doesn’t exist — but there’s plenty of art elsewhere.</p>
      <Link className="underline-link" href="/">
        Back to home
      </Link>
    </section>
  )
}
