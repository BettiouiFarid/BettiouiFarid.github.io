import { buildCollection, buildProperty, EntityCollection, PropertyBuilderProps, Property } from '@firecms/core'

import { callbacks, imageProperty, imagesProperty } from './shared'

// One entry per page, each with its own ID (home, about, projects, stories, contact) and its own fields:
// a field only appears on the page it belongs to. Entries are fixed: they can't be added or deleted.
const only = (page: string | string[], property: Property) => {
  const pages = Array.isArray(page) ? page : [page]
  return ({ entityId }: PropertyBuilderProps) => (entityId && pages.includes(entityId) ? property : null)
}

const highlighted = (page: string, name: string) =>
  only(
    page,
    buildProperty({
      name,
      dataType: 'map',
      description: 'The grey part lights up word by word while scrolling.',
      properties: {
        lead: { name: 'First part (white)', dataType: 'string', multiline: true },
        rest: { name: 'Second part (grey)', dataType: 'string', multiline: true },
      },
    }),
  )

export const pagesCollection: EntityCollection = buildCollection({
  id: 'pages',
  path: 'pages',
  name: 'Pages',
  singularName: 'Page',
  icon: 'web',
  group: 'Content',
  description:
    'One entry per page of the website: home, about, projects, stories and contact. Open a page to edit its texts and its own title, description and share image. The hero animation is under Hero animation.',
  callbacks,
  permissions: { read: true, edit: true, create: false, delete: false },
  propertiesOrder: [
    'metaTitle', 'metaDescription', 'shareImage',
    'role', 'headingLine1', 'headingLine2', 'paragraph',
    'eyebrow', 'intro', 'note', 'bio', 'photos', 'stats', 'services',
  ],
  properties: {
    // ---- On every page
    metaTitle: {
      name: 'Browser title',
      dataType: 'string',
      description: 'The title in the browser tab and in search results. Leave empty to use the default.',
      columnWidth: 260,
    },
    metaDescription: {
      name: 'Search description',
      dataType: 'string',
      multiline: true,
      columnWidth: 420,
      description: 'The short text under the title in search results. Leave empty to use the site default.',
    },
    shareImage: imageProperty('Share image', 'The image shown when this page is shared (1200×630). Leave empty to use the site default.'),

    // ---- Home
    role: only('home', buildProperty({ name: 'Role line', dataType: 'string' })),
    paragraph: highlighted('home', 'Intro paragraph'),

    // ---- Heading (home has its own two lines; the others use the shared header fields)
    headingLine1: only(['home', 'about', 'projects', 'stories', 'contact'], buildProperty({ name: 'Heading, line 1', dataType: 'string' })),
    headingLine2: only(['home', 'about', 'projects', 'stories', 'contact'], buildProperty({ name: 'Heading, line 2', dataType: 'string' })),
    eyebrow: only(['about', 'projects', 'stories', 'contact'], buildProperty({ name: 'Small line above the heading', dataType: 'string' })),
    intro: only(['about', 'projects', 'stories', 'contact'], buildProperty({ name: 'Intro', dataType: 'string', multiline: true })),

    // ---- Contact (email, location, website and social links are under Site settings)
    note: only('contact', buildProperty({ name: 'Note under the email', dataType: 'string', multiline: true, description: 'For example what you are open to, or how fast you reply.' })),

    // ---- About
    bio: highlighted('about', 'Bio'),
    photos: only('about', imagesProperty('Photos', 'Shown next to the bio; they change while scrolling.')),
    stats: only(
      'about',
      buildProperty({
        name: 'Numbers',
        dataType: 'array',
        of: {
          dataType: 'map',
          properties: {
            value: { name: 'Value', dataType: 'string', validation: { required: true } },
            label: { name: 'Label', dataType: 'string', validation: { required: true } },
          },
        },
      }),
    ),
    services: only(
      'about',
      buildProperty({
        name: 'Services',
        dataType: 'array',
        of: {
          dataType: 'map',
          properties: {
            title: { name: 'Title', dataType: 'string', validation: { required: true } },
            description: { name: 'Description', dataType: 'string', multiline: true },
          },
        },
      }),
    ),
  },
})
