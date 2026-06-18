import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Anima',
    short_name: 'Anima',
    description: 'Cura che connette — gestione integrata per pazienti Alzheimer',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#F5F3FF',
    theme_color: '#7C3AED',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
