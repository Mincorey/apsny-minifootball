import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pohtjijcnaezqqrsjdbs.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvaHRqaWpjbmFlenFxcnNqZGJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ2OTkyNCwiZXhwIjoyMDk1MDQ1OTI0fQ.8RHtchGa3zAod5mDZan7PKXxvR8C0BjvRxvgql1FDc';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  console.log('🔧 Создание Storage buckets...\n');
  
  try {
    // Создаем bucket для логотипов
    const { data: logosData, error: logosError } = await supabase.storage.createBucket('team-logos', {
      public: true,
    });

    if (logosError) {
      if (logosError.message.includes('already exists')) {
        console.log(`ℹ️  Bucket "team-logos" уже существует`);
      } else {
        console.error(`❌ Ошибка при создании "team-logos":`, logosError);
      }
    } else {
      console.log(`✅ Bucket "team-logos" создан успешно`);
    }

    // Создаем bucket для фото игроков
    const { data: photosData, error: photosError } = await supabase.storage.createBucket('player-photos', {
      public: true,
    });

    if (photosError) {
      if (photosError.message.includes('already exists')) {
        console.log(`ℹ️  Bucket "player-photos" уже существует`);
      } else {
        console.error(`❌ Ошибка при создании "player-photos":`, photosError);
      }
    } else {
      console.log(`✅ Bucket "player-photos" создан успешно`);
    }

    console.log('\n✨ Storage готов к работе!');
  } catch (error) {
    console.error('\n❌ Критическая ошибка:', error.message);
    process.exit(1);
  }
}

main();
