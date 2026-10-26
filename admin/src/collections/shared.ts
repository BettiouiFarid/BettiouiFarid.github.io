import { buildProperty, EntityCallbacks } from '@firecms/core'

import { revalidateSite } from '../revalidate'

export const callbacks: EntityCallbacks = {
  onSaveSuccess: () => revalidateSite(),
  onDelete: () => revalidateSite(),
}

export const statusProperty = buildProperty({
  name: 'Status',
  dataType: 'string',
  description: 'Only published items appear on the website.',
  validation: { required: true },
  defaultValue: 'draft',
  enumValues: [
    { id: 'published', label: 'Published', color: 'greenDark' },
    { id: 'draft', label: 'Draft', color: 'grayLight' },
  ],
})

// Images go to Firebase Storage under media/, resized to at most 2400px before upload (GIFs are left alone).
// The saved value is the Storage path (e.g. media/ab12_logo.jpg), which the website serves through /img.
export const imageStorage = {
  storagePath: 'media',
  fileName: '{rand}_{file}',
  acceptedFiles: ['image/*'],
  storeUrl: false,
  maxSize: 15 * 1024 * 1024,
  imageResize: { maxWidth: 2400, maxHeight: 2400, mode: 'contain' as const, quality: 85 },
}

export const imageProperty = (name: string, description?: string) =>
  buildProperty({ name, description, dataType: 'string', storage: imageStorage })

export const imagesProperty = (name: string, description?: string) =>
  buildProperty({ name, description, dataType: 'array', of: { dataType: 'string', storage: imageStorage } })
