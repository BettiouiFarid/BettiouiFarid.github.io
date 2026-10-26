import { notFound } from 'next/navigation'

// Any URL that matches no page gets the site's own 404 (with header and footer).
export default function CatchAll() {
  notFound()
}
