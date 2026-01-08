Replace REPLACE_WITH_PLAY_SIGNING_SHA256 with the Play App Signing cert fingerprint before Production rollout.

To get the SHA-256 from Play Console:
1. Go to Release → Setup → App signing
2. Copy the SHA-256 certificate fingerprint
3. Update assetlinks.json with the actual fingerprint
4. Redeploy the web app so the file is served at https://tradeline247ai.com/.well-known/assetlinks.json
