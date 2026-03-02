import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Borongan Citizen Portal',
    short_name: 'Borongan',
    description: 'Official citizen portal for Borongan City, Eastern Samar',
    start_url: '/',
    display: 'standalone',
    background_color: '#F5F7FA',
    theme_color: '#1E3A5F',
    orientation: 'portrait',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
