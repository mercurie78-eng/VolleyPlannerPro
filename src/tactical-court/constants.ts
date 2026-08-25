export const COURT_LENGTH = 18;
export const COURT_WIDTH = 9;
export const ATTACK_ZONE = 3;
export const NET_HEIGHT = 2.43;
export const MIN_ARROW_LENGTH = 0.5;
export const ARROW_COLOR = 0x00ffff;
export const CURVE_STRENGTH = 0.5;

export const PLAYER_TYPES = {
  A: { label: 'A', color: 0xfbbf24 },
  S: { label: 'S', color: 0xef4444 },
  O: { label: 'O', color: 0xf97316 },
  C: { label: 'C', color: 0x3b82f6 },
  L: { label: 'L', color: 0x10b981 },
} as const;

export type PlayerType = keyof typeof PLAYER_TYPES;

export const PLAYER_TYPE_LIST = Object.keys(PLAYER_TYPES) as PlayerType[];

export const PLAYER_BUTTON_COLORS: Record<PlayerType, string> = {
  A: 'bg-amber-400 hover:bg-amber-300',
  S: 'bg-red-500 hover:bg-red-400',
  O: 'bg-orange-500 hover:bg-orange-400',
  C: 'bg-blue-500 hover:bg-blue-400',
  L: 'bg-emerald-500 hover:bg-emerald-400',
};
