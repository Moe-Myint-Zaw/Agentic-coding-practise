# Yaycha Mobile

Expo Router mobile client for the Yaycha social media API.

## Run

```sh
npm install
npx expo start
```

The Android emulator uses `http://10.0.2.2:3000/api/v1` by default because
Android maps `localhost` to the emulator itself. Web and iOS use
`http://localhost:3000/api/v1`.

On a physical device, set `EXPO_PUBLIC_API_URL` to the development machine's
LAN address, for example `http://192.168.74.64:3000/api/v1`, and ensure the
device and computer are on the same network.

## Architecture

- Expo Router route groups protect authenticated tabs at the navigation boundary.
- React Query owns API state and invalidates feed, post, comment, and profile data after mutations.
- Native access tokens use `expo-secure-store`; web uses the isolated local-storage fallback until the API supports httpOnly cookies.
- English and Myanmar resources live in `i18n/`, with language and theme preferences persisted on web.

The current backend does not expose refresh or logout routes, so logout clears
the local session and a 401 response fails closed back to login.
