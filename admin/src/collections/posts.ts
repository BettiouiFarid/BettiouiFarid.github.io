import { buildCollection } from '@firecms/core'

import { callbacks, imageProperty, statusProperty } from './shared'

export const postsCollection = buildCollection({
  id: 'posts',
  path: 'posts',
  name: 'Stories',
  singularName: 'Story',
  icon: 'article',
  group: 'Content',
  description: 'Blog posts. The ID you choose becomes the web address: /blog/your-id.',
  customId: true,
  callbacks,
  initialSort: ['publishedAt', 'desc'],
  propertiesOrder: ['title', 'status', 'publishedAt', 'category', 'cover', 'content'],
  properties: {
    title: { name: 'Title', dataType: 'string', validation: { required: true } },
    status: statusProperty,
    publishedAt: { name: 'Published on', dataType: 'date', mode: 'date_time', validation: { required: true } },
    category: {
      name: 'Category',
      dataType: 'string',
      description: 'Shown as the yellow tag, e.g. Design.',
      validation: { required: true },
    },
    cover: imageProperty('Cover image'),
    content: {
      name: 'Story',
      dataType: 'string',
      markdown: true,
      description: 'A quote block (">") is shown as the large centred pull quote.',
      validation: { required: true },
    },
  },
})
