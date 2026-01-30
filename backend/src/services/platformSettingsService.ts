import { query } from '../config/database';

/**
 * Get a platform setting by key
 */
export const getSetting = async (key: string): Promise<string | null> => {
  const result = await query(
    'SELECT setting_value, data_type FROM platform_settings WHERE setting_key = $1',
    [key]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const { setting_value, data_type } = result.rows[0];

  // Parse based on data type
  switch (data_type) {
    case 'boolean':
      return setting_value === 'true' ? 'true' : 'false';
    case 'number':
      return setting_value;
    case 'json':
      return setting_value;
    default:
      return setting_value;
  }
};

/**
 * Get a platform setting as a number
 */
export const getSettingAsNumber = async (key: string, defaultValue: number = 0): Promise<number> => {
  const value = await getSetting(key);
  if (value === null) return defaultValue;
  const num = parseFloat(value);
  return isNaN(num) ? defaultValue : num;
};

/**
 * Get a platform setting as a boolean
 */
export const getSettingAsBoolean = async (key: string, defaultValue: boolean = false): Promise<boolean> => {
  const value = await getSetting(key);
  if (value === null) return defaultValue;
  return value === 'true';
};

/**
 * Set a platform setting
 */
export const setSetting = async (
  key: string,
  value: string,
  dataType: 'string' | 'number' | 'boolean' | 'json',
  description?: string,
  updatedBy?: number
): Promise<void> => {
  await query(
    `INSERT INTO platform_settings (setting_key, setting_value, data_type, description, updated_by, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (setting_key)
     DO UPDATE SET
       setting_value = EXCLUDED.setting_value,
       data_type = EXCLUDED.data_type,
       description = COALESCE(EXCLUDED.description, platform_settings.description),
       updated_by = EXCLUDED.updated_by,
       updated_at = NOW()`,
    [key, value, dataType, description, updatedBy]
  );
};

/**
 * Get all settings (for admin panel)
 */
export const getAllSettings = async (): Promise<Array<{
  id: number;
  setting_key: string;
  setting_value: string;
  data_type: string;
  description: string | null;
  updated_at: string;
}>> => {
  const result = await query(
    'SELECT id, setting_key, setting_value, data_type, description, updated_at FROM platform_settings ORDER BY setting_key'
  );
  return result.rows;
};

/**
 * Get premium discount settings for author subscriptions
 */
export const getPremiumDiscountSettings = async (): Promise<{
  enabled: boolean;
  discountPercent: number;
}> => {
  const [enabled, discountPercent] = await Promise.all([
    getSettingAsBoolean('author_subscription_premium_discount_enabled', true),
    getSettingAsNumber('author_subscription_premium_discount_percent', 20),
  ]);

  return { enabled, discountPercent };
};

/**
 * Update premium discount settings
 */
export const updatePremiumDiscountSettings = async (
  discountPercent: number,
  enabled: boolean,
  updatedBy?: number
): Promise<void> => {
  await Promise.all([
    setSetting('author_subscription_premium_discount_percent', discountPercent.toString(), 'number', 'Percentage discount on author subscriptions for platform premium members', updatedBy),
    setSetting('author_subscription_premium_discount_enabled', enabled.toString(), 'boolean', 'Enable/disable premium member discounts on author subscriptions', updatedBy),
  ]);
};
