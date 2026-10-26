import { buildCollection } from '@firecms/core'

import { TrailPanel } from '../TrailPanel'
import { callbacks } from './shared'
import { trailDefaults, trailLimits } from '../hero'

export const trailCollection = buildCollection({
  id: 'trail',
  path: 'trail',
  name: 'Cursor trail',
  singularName: 'Cursor trail',
  icon: 'brush',
  group: 'Content',
  description: 'The line that follows the mouse on the website: thickness, duration, opacity, length and colour. Open it and use the Control panel tab to try changes as you make them.',
  callbacks,
  hideIdFromForm: true, // single entry; its ID (settings) never changes
  permissions: { read: true, edit: true, create: false, delete: false },
  entityViews: [{ key: 'panel', name: 'Control panel', includeActions: true, Builder: TrailPanel }],
  properties: {
    enabled: { name: 'Show on the website', dataType: 'boolean', defaultValue: trailDefaults.enabled },
    color: {
      name: 'Colour',
      dataType: 'string',
      defaultValue: trailDefaults.color,
      description: 'Hex colour, e.g. #efb818.',
      validation: { matches: /^#[0-9a-fA-F]{6}$/, matchesMessage: 'Use a hex colour like #efb818' },
    },
    width: { name: 'Thickness (px)', dataType: 'number', defaultValue: trailDefaults.width, validation: trailLimits.width },
    fadeSeconds: { name: 'Duration (seconds)', dataType: 'number', defaultValue: trailDefaults.fadeSeconds, validation: trailLimits.fadeSeconds },
    opacity: { name: 'Opacity (0.1 – 1)', dataType: 'number', defaultValue: trailDefaults.opacity, validation: trailLimits.opacity },
    length: { name: 'Length (px)', dataType: 'number', defaultValue: trailDefaults.length, validation: trailLimits.length },
  },
})
