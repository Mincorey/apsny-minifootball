const https = require('https');

const supabaseUrl = 'https://pohtjijcnaezqqrsjdbs.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvaHRqaWpjbmFlenFxcnNqZGJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ2OTkyNCwiZXhwIjoyMDk1MDQ1OTI0fQ.8RHtchGa3zAod5mDZan7PKXxvR8C0BjvRxvgql1FDc';

const buckets = ['team-logos', 'player-photos'];

async function createBucket(bucketName) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      name: bucketName,
      public: true
    });

    const options = {
      hostname: 'pohtjijcnaezqqrsjdbs.supabase.co',
      port: 443,
      path: '/storage/v1/bucket',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log(`✅ Bucket "${bucketName}" создан успешно`);
          resolve(true);
        } else if (res.statusCode === 409) {
          console.log(`ℹ️  Bucket "${bucketName}" уже существует`);
          resolve(true);
        } else {
          console.error(`❌ Ошибка при создании "${bucketName}":`, res.statusCode, responseData);
          reject(new Error(responseData));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Ошибка сети:`, error.message);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('🔧 Создание Storage buckets...\n');
  try {
    for (const bucket of buckets) {
      await createBucket(bucket);
    }
    console.log('\n✨ Все buckets готовы!');
  } catch (error) {
    console.error('\n❌ Ошибка:', error.message);
    process.exit(1);
  }
}

main();
