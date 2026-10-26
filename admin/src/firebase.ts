import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { initializeApp } from 'firebase/app'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage } from 'firebase/storage'

// Local builds (`npm run admin:build:local`) talk to the Firebase emulators (`npm run emulators`).
export const useEmulators = import.meta.env.VITE_USE_EMULATORS === 'true'

const env = import.meta.env
const config = useEmulators
  ? { apiKey: 'demo-key', authDomain: 'localhost', projectId: 'demo-portfolio', storageBucket: 'demo-portfolio.appspot.com', appId: 'demo' }
  : {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      appId: env.VITE_FIREBASE_APP_ID,
    }

// Created at load time, before FireCMS touches Firestore/Auth/Storage, so the emulators are connected first.
export const firebaseApp = initializeApp(config)

if (useEmulators) {
  connectAuthEmulator(getAuth(firebaseApp), 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(getFirestore(firebaseApp), '127.0.0.1', 8080)
  connectStorageEmulator(getStorage(firebaseApp), '127.0.0.1', 9199)
}
