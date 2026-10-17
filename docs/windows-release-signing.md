# Windows release signing

Public Windows releases use Microsoft Azure Artifact Signing to Authenticode-sign the packaged app and the Squirrel setup executable. The release workflow stops before publishing if signing is not configured, so an unsigned installer is not advertised as a trusted download.

## One-time setup

1. Create an Azure Artifact Signing account and a **Public Trust** certificate profile. Complete Microsoft's identity verification for the publisher. Public Trust eligibility depends on the publisher's location and account type; check [Microsoft's current code-signing options](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/code-signing-options).
2. Create an Azure app registration and a federated identity credential for this GitHub repository and the `Publish desktop release` workflow. Grant it the **Artifact Signing Certificate Profile Signer** role on the certificate profile. Use GitHub's OIDC subject for this repository; do not create a long-lived client secret.
3. Add these repository Actions secrets in GitHub. The endpoint, account and profile values come from the Azure Artifact Signing resource:

   - `AZURE_TENANT_ID`
   - `AZURE_CLIENT_ID`
   - `AZURE_SUBSCRIPTION_ID`
   - `AZURE_ARTIFACT_SIGNING_ENDPOINT`
   - `AZURE_ARTIFACT_SIGNING_ACCOUNT`
   - `AZURE_ARTIFACT_SIGNING_PROFILE`

4. Confirm the federated credential allows the `main` release workflow to request an OIDC token, then publish a new version tag from `main`. The existing v5.0.0 installer cannot be retroactively signed; publish a new release after the secrets and Azure profile are ready.

## What Windows may show

The signature identifies the verified publisher and helps Windows assess the download. SmartScreen reputation builds over time, so the first signed release can still show a reputation warning. A signature cannot guarantee that every Windows configuration will show no warning or install error. Microsoft explains this in its [SmartScreen reputation guidance](https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation).
