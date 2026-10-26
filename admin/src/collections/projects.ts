import { buildCollection } from '@firecms/core'

import { callbacks, imageProperty, imagesProperty, statusProperty } from './shared'

export const projectsCollection = buildCollection({
  id: 'projects',
  path: 'projects',
  name: 'Projects',
  singularName: 'Project',
  icon: 'work',
  group: 'Content',
  description: 'The work shown on the Projects page. The ID you choose becomes the web address: /work/your-id.',
  customId: true,
  callbacks,
  initialSort: ['order', 'asc'],
  propertiesOrder: ['title', 'status', 'featured', 'order', 'cover', 'summary', 'industry', 'client', 'service', 'date', 'gallery'],
  properties: {
    title: { name: 'Title', dataType: 'string', columnWidth: 200, validation: { required: true } },
    status: statusProperty,
    featured: {
      name: 'On home',
      columnWidth: 150,
      dataType: 'boolean',
      description: 'Featured projects appear under "Latest projects" on the home page.',
    },
    order: {
      name: 'Order',
      columnWidth: 120,
      dataType: 'number',
      description: 'Lower numbers come first in every list (10, 20, 30…).',
      validation: { required: true },
      defaultValue: 100,
    },
    cover: imageProperty('Cover image', 'Thumbnail on the home and projects pages. Leave empty for the striped placeholder.'),
    summary: { name: 'Summary', dataType: 'string', multiline: true, columnWidth: 280 },
    industry: { name: 'Industry', dataType: 'string' },
    client: { name: 'Client', dataType: 'string' },
    service: { name: 'Service', dataType: 'string' },
    date: { name: 'Date', dataType: 'date', mode: 'date' },
    gallery: imagesProperty('Gallery', 'Full-width images on the project page, top to bottom. Drag to reorder.'),
  },
})
