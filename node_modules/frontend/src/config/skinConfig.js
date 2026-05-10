export const SKIN_ICONS = {
  default: '🧙',
  fire_mage: '🧙‍♂️',
  ice_mage: '🧙‍♀️',
  thunder_mage: '⚡',
  nature_mage: '🌿',
  shadow_mage: '🌙',
  golden_mage: '👑',
  rainbow_mage: '🌈',
  cosmic_mage: '🌌'
};

export function getSkinIcon(skinId) {
  return SKIN_ICONS[skinId] || SKIN_ICONS.default;
}
