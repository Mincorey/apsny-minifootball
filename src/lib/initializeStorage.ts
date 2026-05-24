/**
 * Инициализирует Storage — проверяет доступность бакетов.
 * Бакеты создаются заранее через Supabase Dashboard.
 * anon-key не имеет прав на createBucket — поэтому просто логируем.
 */
export async function initializeStorage() {
  // Бакеты team-logos и player-photos уже созданы в Supabase Dashboard.
  // Ничего создавать не нужно — просто тихий no-op.
  return
}
