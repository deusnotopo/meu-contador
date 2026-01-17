# Tutorial: Automatic Firestore Backups (Blaze Plan)

Since you are on the **Blaze Plan**, you can configure automatic backups to Google Cloud Storage.

## Step 1: Create a Storage Bucket

1. Go to the [Google Cloud Console](https://console.cloud.google.com/storage).
2. Create a new bucket named `meu-contador-backups`.
3. Select "Standard" class and a region close to your users (e.g. `southamerica-east1`).

## Step 2: Configure Permissions via Cloud Shell

Run these commands in the Google Cloud Shell (icon in top right of console):

```bash
# 1. Set project
gcloud config set project meucontador-367cf

# 2. Enable Firestore Export
gcloud services enable firestore.googleapis.com

# 3. Grant permission to the backup service account
gcloud projects add-iam-policy-binding meucontador-367cf \
    --member serviceAccount:meucontador-367cf@appspot.gserviceaccount.com \
    --role roles/datastore.importExportAdmin
```

## Step 3: Create Cloud Scheduler Job

1. Go to [Cloud Scheduler](https://console.cloud.google.com/cloudscheduler).
2. Create a job:
   - **Name**: `firestore-backup-daily`
   - **Frequency**: `0 3 * * *` (Daily at 3 AM)
   - **Timezone**: Brazil/Sao_Paulo
   - **Target**: HTTP
   - **URL**: `https://firestore.googleapis.com/v1/projects/meucontador-367cf/databases/(default):exportDocuments`
   - **Method**: POST
   - **Body**: `{ "outputUriPrefix": "gs://meu-contador-backups/daily" }`
   - **Auth**: OAuth (Select your service account)

Done! Your financial data is now safe.
