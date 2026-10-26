import { buildCollection } from '@firecms/core'

import { HeroPreview } from '../HeroPreview'
import { callbacks, imagesProperty } from './shared'

export const heroCollection = buildCollection({
  id: 'hero',
  path: 'hero',
  name: 'Hero animation',
  singularName: 'Hero animation',
  icon: 'animation',
  group: 'Content',
  description: 'The animated frames behind the home page heading. Open it, then use the Preview tab to see it play. The cursor trail has its own section.',
  callbacks,
  hideIdFromForm: true, // single entry; its ID (settings) never changes
  permissions: { read: true, edit: true, create: false, delete: false },
  entityViews: [
    { key: 'preview', name: 'Preview', includeActions: true, Builder: HeroPreview },
  ],
  properties: {
    frames: {
      name: 'Photo frames',
      dataType: 'array',
      description: 'Frames drifting diagonally behind the heading, left to right in this order. Each one flips through its own pictures.',
      of: {
        dataType: 'map',
        properties: {
          shape: {
            name: 'Shape',
            dataType: 'string',
            defaultValue: 'portrait',
            validation: { required: true },
            enumValues: [
              { id: 'portrait', label: 'Portrait' },
              { id: 'landscape', label: 'Landscape' },
              { id: 'square', label: 'Square' },
            ],
          },
          interval: {
            name: 'Seconds per picture',
            dataType: 'number',
            defaultValue: 0.5,
            description: 'How long each picture stays before the next one appears (e.g. 0.5).',
            validation: { required: true, min: 0.1, max: 10 },
          },
          images: imagesProperty('Pictures', '2 to 5 pictures, shown in this order, on repeat.'),
        },
      },
    },
    tilt: {
      name: 'Tilt',
      dataType: 'number',
      defaultValue: -30,
      description: 'Angle of the strip in degrees. -30 rises to the right; 30 falls to the right; 0 is flat.',
      validation: { min: -89, max: 89 },
    },
    speed: {
      name: 'Speed',
      dataType: 'number',
      defaultValue: 40,
      description: 'How fast the frames drift, in pixels per second. 0 keeps them still.',
      validation: { min: 0, max: 400 },
    },
    spacing: {
      name: 'Space between frames',
      dataType: 'number',
      defaultValue: 370,
      description: 'Pixels between one frame and the next.',
      validation: { min: 0, max: 2000 },
    },
  },
})
