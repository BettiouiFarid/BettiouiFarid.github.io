import { buildCollection } from '@firecms/core'

import { callbacks, imageProperty } from './shared'

export const siteCollection = buildCollection({
  id: 'site',
  path: 'site',
  name: 'Site settings',
  singularName: 'Site settings',
  icon: 'settings',
  group: 'Content',
  description: 'Contact details, social links, footer and the default search description. These also fill the Contact page. Each page’s own texts are under Pages.',
  callbacks,
  hideIdFromForm: true, // single entry; its ID (settings) never changes
  permissions: { read: true, edit: true, create: false, delete: false },
  properties: {
    name: { name: 'Site name', dataType: 'string', validation: { required: true } },
    description: { name: 'Description', dataType: 'string', multiline: true, description: 'For search engines and link previews.' },
    shareImage: imageProperty('Share image', '1200×630 image for link previews.'),
    email: { name: 'Email', dataType: 'string', email: true, validation: { required: true } },
    website: { name: 'Website', dataType: 'string', description: 'Without https://, e.g. faridbettioui.art' },
    location: { name: 'Location', dataType: 'string' },
    socials: {
      name: 'Social links',
      dataType: 'array',
      of: {
        dataType: 'map',
        properties: {
          label: { name: 'Label', dataType: 'string', validation: { required: true } },
          url: { name: 'URL', dataType: 'string', url: true, validation: { required: true } },
        },
      },
    },
    copyright: { name: 'Footer text', dataType: 'string', description: 'Shown after "© year —".' },
    footerMarquee: { name: 'Giant footer text', dataType: 'string', description: 'The big scrolling text at the bottom of every page.' },
  },
})
