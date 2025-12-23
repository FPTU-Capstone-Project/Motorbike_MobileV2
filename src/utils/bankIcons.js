import { Image } from 'react-native';

/**
 * Bank icon mapping utility
 * Maps bank shortNames to MaterialIcons or uses logo URL from backend
 */

// Map bank shortNames to MaterialIcons (fallback when logo URL is not available)
const BANK_ICON_MAP = {
  'VCB': 'account-balance',
  'VIETCOMBANK': 'account-balance',
  'VTB': 'account-balance-wallet',
  'VIETINBANK': 'account-balance-wallet',
  'BIDV': 'account-balance',
  'AGRIBANK': 'account-balance',
  'ACB': 'account-balance',
  'TECHCOMBANK': 'account-balance',
  'TPBANK': 'account-balance-wallet',
  'VPBANK': 'account-balance-wallet',
  'MBBANK': 'account-balance',
  'MB': 'account-balance',
  'SACOMBANK': 'account-balance',
  'SCB': 'account-balance',
  'HDBANK': 'account-balance-wallet',
  'HD': 'account-balance-wallet',
  'SHB': 'account-balance',
  'SEABANK': 'account-balance',
  'OCB': 'account-balance-wallet',
  'VIB': 'account-balance',
  'EXIMBANK': 'account-balance',
  'MSB': 'account-balance',
  'VIETBANK': 'account-balance',
  'NAB': 'account-balance',
  'BAB': 'account-balance',
  'PGBANK': 'account-balance',
  'PUBLICBANK': 'account-balance',
  'PVCOMBANK': 'account-balance',
  'BAOVIETBANK': 'account-balance',
};

/**
 * Get bank icon component
 * @param {Object} bank - Bank object with shortName, short_name, or logo
 * @param {number} size - Icon size (default: 24)
 * @param {string} color - Icon color (default: '#666')
 * @returns {React.Component} Icon component
 */
export const getBankIcon = (bank, size = 24, color = '#666') => {
  const shortName = bank?.shortName || bank?.short_name || '';
  const logoUrl = bank?.logo;
  
  // If logo URL is available, use Image component
  if (logoUrl && logoUrl.trim() !== '') {
    return (
      <Image
        source={{ uri: logoUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="contain"
      />
    );
  }
  
  // Otherwise, use MaterialIcon based on shortName
  const iconName = BANK_ICON_MAP[shortName.toUpperCase()] || 'account-balance-wallet';
  return iconName;
};

/**
 * Get bank icon name for MaterialIcons
 * @param {Object} bank - Bank object
 * @returns {string} Icon name
 */
export const getBankIconName = (bank) => {
  const shortName = bank?.shortName || bank?.short_name || '';
  const logoUrl = bank?.logo;
  
  // If logo URL exists, return null to use Image instead
  if (logoUrl && logoUrl.trim() !== '') {
    return null;
  }
  
  return BANK_ICON_MAP[shortName.toUpperCase()] || 'account-balance-wallet';
};

/**
 * Check if bank has logo URL
 * @param {Object} bank - Bank object
 * @returns {boolean}
 */
export const hasBankLogo = (bank) => {
  const logoUrl = bank?.logo;
  return logoUrl && logoUrl.trim() !== '';
};






