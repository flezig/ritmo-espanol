export const CURRENT_DATA_SCHEMA_VERSION = 1;

/**
 * Data is migrated forward in place and never cleared during an application
 * update. Add future migrations as another numbered branch before increasing
 * CURRENT_DATA_SCHEMA_VERSION.
 */
export const migrateLocalProgress = () => {
  if (typeof localStorage === 'undefined') return;
  const saved = Number(localStorage.getItem('ritmo-data-schema-version') || 0);
  if (saved >= CURRENT_DATA_SCHEMA_VERSION) return;
  if (saved < 1) {
    // Version 1 formalises the existing stable keys. Existing values already
    // have the correct shape, so preserving them is the migration.
  }
  localStorage.setItem(
    'ritmo-data-schema-version',
    String(CURRENT_DATA_SCHEMA_VERSION),
  );
};
