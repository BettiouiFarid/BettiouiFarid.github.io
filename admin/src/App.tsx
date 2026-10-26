import {
  AppBar,
  Authenticator,
  CircularProgressCenter,
  Drawer,
  FireCMS,
  FireCMSi18nProvider,
  ModeControllerProvider,
  NavigationRoutes,
  Scaffold,
  SideDialogs,
  SnackbarProvider,
  useBuildLocalConfigurationPersistence,
  useBuildModeController,
  useBuildNavigationController,
  useValidateAuthenticator,
} from '@firecms/core'
import {
  FirebaseAuthController,
  FirebaseLoginView,
  FirebaseSignInProvider,
  FirebaseUserWrapper,
  useFirebaseAuthController,
  useFirebaseStorageSource,
  useFirestoreDelegate,
} from '@firecms/firebase'
import { doc, getDoc, getFirestore } from 'firebase/firestore'
import { useCallback, useMemo } from 'react'

import { heroCollection } from './collections/hero'
import { trailCollection } from './collections/trail'
import { pagesCollection } from './collections/pages'
import { postsCollection } from './collections/posts'
import { projectsCollection } from './collections/projects'
import { siteCollection } from './collections/site'
import { firebaseApp, useEmulators } from './firebase'

import '@fontsource/manrope/400.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/manrope/800.css'
import '@fontsource/jetbrains-mono'

const logo = `${import.meta.env.BASE_URL}crown.svg`

const signInOptions: FirebaseSignInProvider[] = useEmulators ? ['password'] : ['google.com']

export default function App() {
  // Editors are the emails listed under /admins in Firestore. The Firestore and Storage rules enforce
  // the same list, so this check only decides whether to show the login error or the CMS.
  const authenticator: Authenticator<FirebaseUserWrapper> = useCallback(async ({ user }) => {
    const email = user?.email?.toLowerCase()
    if (!email) throw Error('Sign in with an account that has an email address.')
    const allowed = await getDoc(doc(getFirestore(firebaseApp), 'admins', email)).then(
      (snap) => snap.exists(),
      () => false,
    )
    if (!allowed) throw Error(`${email} is not allowed to edit this site.`)
    return true
  }, [])

  const collections = useMemo(() => [pagesCollection, projectsCollection, postsCollection, heroCollection, trailCollection, siteCollection], [])

  const modeController = useBuildModeController()
  const authController: FirebaseAuthController = useFirebaseAuthController({ firebaseApp, signInOptions })
  const userConfigPersistence = useBuildLocalConfigurationPersistence()
  const firestoreDelegate = useFirestoreDelegate({ firebaseApp })
  const storageSource = useFirebaseStorageSource({ firebaseApp })

  const { authLoading, canAccessMainView, notAllowedError } = useValidateAuthenticator({
    authController,
    authenticator,
    dataSourceDelegate: firestoreDelegate,
    storageSource,
  })

  const navigationController = useBuildNavigationController({
    collections,
    authController,
    dataSourceDelegate: firestoreDelegate,
  })

  return (
    <FireCMSi18nProvider>
      <SnackbarProvider>
        <ModeControllerProvider value={modeController}>
          <FireCMS
            navigationController={navigationController}
            authController={authController}
            userConfigPersistence={userConfigPersistence}
            dataSourceDelegate={firestoreDelegate}
            storageSource={storageSource}
          >
            {({ loading }) => {
              if (loading || authLoading) return <CircularProgressCenter size="large" />
              if (!canAccessMainView) {
                return (
                  <FirebaseLoginView
                    authController={authController}
                    firebaseApp={firebaseApp}
                    signInOptions={signInOptions}
                    logo={logo}
                    notAllowedError={notAllowedError}
                  />
                )
              }
              return (
                <Scaffold autoOpenDrawer={false} logo={logo}>
                  <AppBar title="Farid Bettioui — CMS" logo={logo} />
                  <Drawer />
                  <NavigationRoutes />
                  <SideDialogs />
                </Scaffold>
              )
            }}
          </FireCMS>
        </ModeControllerProvider>
      </SnackbarProvider>
    </FireCMSi18nProvider>
  )
}
