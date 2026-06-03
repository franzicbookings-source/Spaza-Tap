import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import { Firestore } from '@google-cloud/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import configuration dynamically
const configPath = path.resolve(__dirname, '../firebase-applet-config.json');
let firebaseConfig = {};
if (fs.existsSync(configPath)) {
  try {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    console.error('⚠️ Could not read firebase-applet-config.json:', err.message);
  }
}

// Operational collections used by Spaza Tap
const TARGET_COLLECTIONS = [
  'users',
  'shops',
  'customers',
  'products',
  'sales',
  'sale_items',
  'transactions',
  'credit_entries',
  'expenses',
  'suppliers',
  'purchases',
  'customer_access_requests',
  'telemetry_events',
  'password_resets',
  'cash_ups',
  'wholesale_prices',
  'emergency_contacts',
  'municipality_contacts',
  'gov_support_applications',
  'shop_documents',
  'reminders',
  'incident_reports',
  'important_alerts',
  'shop_updates',
  'food_safety_checks'
];

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const deleteAuthUsers = args.includes('--delete-auth-users');

  // Parse Key argument inside argv
  const keyArgIndex = args.indexOf('--key');
  const serviceAccountJsonPath = keyArgIndex !== -1 ? args[keyArgIndex + 1] : null;

  // Parse custom parameters
  const confirmArgIndex = args.indexOf('--confirm');
  const confirmStr = confirmArgIndex !== -1 ? args[confirmArgIndex + 1] : null;

  console.log('====================================================');
  console.log('🔥 SPAZA TAP FIREBASE DATA RESET & CLEANUP ENGINE 🔥');
  console.log('====================================================');

  const projectId = firebaseConfig.projectId;
  const databaseId = firebaseConfig.firestoreDatabaseId;

  if (!projectId) {
    console.error('❌ Error: Could not determine Project ID from profile config.');
    process.exit(1);
  }

  console.log(`Detected Firebase Project:    ${projectId}`);
  console.log(`Detected Firestore Database: ${databaseId || '(default)'}`);
  console.log('----------------------------------------------------');

  // Verify parameters unless dry-run
  if (!isDryRun) {
    if (confirmStr !== 'RESET SPAZA TAP') {
      console.error('❌ Safety Error: You must supply the precise confirmation string to perform reset:');
      console.error('   node scripts/cleanFirebaseData.js --confirm "RESET SPAZA TAP"');
      console.error('\nℹ️ Or run in Dry Run mode to preview operations:');
      console.error('   node scripts/cleanFirebaseData.js --dry-run');
      console.log('====================================================');
      process.exit(1);
    }
  } else {
    console.log('⚙️ RUNNING IN DRY-RUN MODE: No real-time mutations will be made.');
    console.log('----------------------------------------------------');
  }

  // Initialize Admin App Credentials
  console.log('Connecting to Firebase Admin API...');
  
  let credential = admin.credential.applicationDefault();

  if (serviceAccountJsonPath) {
    console.log(`🔑 Loading explicit service account key from: ${serviceAccountJsonPath}`);
    if (fs.existsSync(serviceAccountJsonPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountJsonPath, 'utf8'));
      credential = admin.credential.cert(serviceAccount);
    } else {
      console.error(`❌ Error: Service account file not found at matching path: ${serviceAccountJsonPath}`);
      process.exit(1);
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('🔑 Using GOOGLE_APPLICATION_CREDENTIALS environment variable.');
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.log('🔑 Using JSON credential string from FIREBASE_SERVICE_ACCOUNT_KEY env var.');
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      credential = admin.credential.cert(serviceAccount);
    } catch (e) {
      console.error('❌ Error parsing FIREBASE_SERVICE_ACCOUNT_KEY env variable as JSON:', e.message);
      process.exit(1);
    }
  } else {
    console.warn('⚠️ Warning: No explicit service account file or environment key provided.');
    console.warn('   Attempting to fall back to Application Default Credentials (ADC)...');
  }

  try {
    admin.initializeApp({
      credential,
      projectId
    });
    console.log('✅ Firebase Admin initialized successfully!');
  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
    console.log('   Note: Run with `--key path/to/serviceAccountKey.json` to configure credentials locally.');
    process.exit(1);
  }

  // Manual configuration for the targeted sub-database using Firestore SDK
  const db = new Firestore({
    projectId,
    databaseId,
    // Pass custom credentials if using certificate details
    ...(serviceAccountJsonPath || process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? {
      credentials: serviceAccountJsonPath
        ? JSON.parse(fs.readFileSync(serviceAccountJsonPath, 'utf8'))
        : JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    } : {})
  });

  const auth = admin.auth();

  // Create clean backups destination
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDirName = `spaza-tap-backup-before-cleanup-${dateStr}`;
  const backupPath = path.resolve(__dirname, '../', backupDirName);

  console.log(`\n📋 Backup destination folder: ${backupDirName}`);
  if (!isDryRun) {
    fs.mkdirSync(backupPath, { recursive: true });
    console.log('Creating JSON database schema backups...');
  }

  // 1. Process and Backup Collections
  console.log('\n🔎 Scanning operational collections in progress...');
  let totalDocsToDelete = 0;
  const docsPerCollection = {};
  const collectionBackupsMap = {};

  for (const collectionName of TARGET_COLLECTIONS) {
    try {
      const colRef = db.collection(collectionName);
      const snapshot = await colRef.get();
      const docCount = snapshot.size;
      docsPerCollection[collectionName] = docCount;
      totalDocsToDelete += docCount;

      console.log(`  📁 [${collectionName}]: Found ${docCount} documents.`);

      if (docCount > 0) {
        const documentsData = [];
        snapshot.forEach(doc => {
          documentsData.push({
            id: doc.id,
            data: doc.data()
          });
        });
        collectionBackupsMap[collectionName] = documentsData;

        if (!isDryRun) {
          fs.writeFileSync(
            path.join(backupPath, `${collectionName}.json`),
            JSON.stringify(documentsData, null, 2),
            'utf8'
          );
        }
      }
    } catch (err) {
      console.error(`  ❌ Failed to access collection [${collectionName}]:`, err.message);
      docsPerCollection[collectionName] = 0;
    }
  }

  if (!isDryRun && totalDocsToDelete > 0) {
    console.log('✅ Backups written successfully to local schemas!');
  }

  // 2. Process Firebase Authentication Users
  console.log('\n👤 Scanning Firebase Authentication users...');
  const usersToReset = [];
  try {
    let nextPageToken;
    do {
      const listUsersResult = await auth.listUsers(1000, nextPageToken);
      listUsersResult.users.forEach(userRecord => {
        usersToReset.push({
          uid: userRecord.uid,
          email: userRecord.email,
          displayName: userRecord.displayName
        });
      });
      nextPageToken = listUsersResult.nextPageToken;
    } while (nextPageToken);

    console.log(`  Found ${usersToReset.length} authentications registered.`);
  } catch (err) {
    console.warn('⚠️ Could not fetch Authentication users list (check rules or credentials):', err.message);
  }

  // Final confirmation review summary
  console.log('\n================ REVIEW MATTERS ====================');
  console.log(`Total Collections Scheduled for Cleanup:  ${TARGET_COLLECTIONS.length}`);
  console.log(`Total Firestore Documents Found:          ${totalDocsToDelete}`);
  console.log(`Total Firebase Auth Accounts Found:       ${usersToReset.length}`);
  console.log(`Auth Accounts Scheduled for Deletion:     ${deleteAuthUsers ? 'YES' : 'NO'}`);
  console.log('====================================================');

  if (isDryRun) {
    console.log('\n✅ Dry-Run process completed. No modifications were recorded!');
    console.log('====================================================');
    process.exit(0);
  }

  if (totalDocsToDelete === 0 && (!deleteAuthUsers || usersToReset.length === 0)) {
    console.log('\n✨ Database is already clean. No records found to delete!');
    console.log('====================================================');
    process.exit(0);
  }

  // Real execution
  console.log('\n🔥 Resetting database records in progress...');

  // Deleting Firestore Collections
  for (const collectionName of TARGET_COLLECTIONS) {
    const count = docsPerCollection[collectionName];
    if (!count || count === 0) continue;

    console.log(`  Deleting documents in collection: [${collectionName}]...`);
    const colRef = db.collection(collectionName);
    const snapshot = await colRef.get();

    for (const doc of snapshot.docs) {
      try {
        await db.recursiveDelete(doc.ref);
      } catch (err) {
        console.error(`    ⚠️ Failed to recursively delete doc ${doc.id} under ${collectionName}:`, err.message);
      }
    }
    console.log(`    Cleaned ${count} records from [${collectionName}].`);
  }

  // Deleting Firebase Authentication Users
  if (deleteAuthUsers && usersToReset.length > 0) {
    console.log('\n👤 Deleting Firebase Authentication users...');
    const uids = usersToReset.map(u => u.uid);
    const batchSize = 1000;
    for (let i = 0; i < uids.length; i += batchSize) {
      const batchUids = uids.slice(i, i + batchSize);
      try {
        const deleteResult = await auth.deleteUsers(batchUids);
        console.log(`  Successfully deleted batch of ${deleteResult.successCount} auth users.`);
        if (deleteResult.failureCount > 0) {
          console.error(`  ⚠️ Failed to delete ${deleteResult.failureCount} auth users.`);
          deleteResult.errors.forEach(err => console.error(`    - Error ${err.index}: ${err.error.message}`));
        }
      } catch (err) {
        console.error('  ⚠️ Critical failure deleting auth batch:', err.message);
      }
    }
  } else if (!deleteAuthUsers && usersToReset.length > 0) {
    console.log('\nℹ️ Skipping Firebase Authentication user cleanup (pass --delete-auth-users to include).');
  }

  console.log('\n🎉 ====================================================');
  console.log('🎉 SPAZA TAP CLEANUP ACTIONS EXECUTED SUCCESSFULLY!');
  console.log('======================================================');
}

main().catch(err => {
  console.error('\n❌ Unhandled processing error occurred during reset:', err.message);
  process.exit(1);
});
