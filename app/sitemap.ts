import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://egdesk.cloud';

  return [
    {
      url: `${base}/`,
      priority: 1,
    },
    {
      url: `${base}/internet-banking-ai`,
      priority: 0.9,
    },
    {
      url: `${base}/landing/detail`,
      priority: 0.8,
    },
  ];
}
