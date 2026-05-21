/**
 * Discord-like permission bitfield system.
 * Each permission is a power of 2, allowing them to be combined with bitwise OR.
 */

export const Permissions = {
  // General
  ADMINISTRATOR: 1n << 0n,
  MANAGE_SERVER: 1n << 1n,
  MANAGE_ROLES: 1n << 2n,
  MANAGE_CHANNELS: 1n << 3n,
  KICK_MEMBERS: 1n << 4n,
  BAN_MEMBERS: 1n << 5n,
  CREATE_INVITE: 1n << 6n,
  CHANGE_NICKNAME: 1n << 7n,
  MANAGE_NICKNAMES: 1n << 8n,
  MANAGE_EMOJIS: 1n << 9n,

  // Text
  SEND_MESSAGES: 1n << 10n,
  EMBED_LINKS: 1n << 11n,
  ATTACH_FILES: 1n << 12n,
  READ_MESSAGE_HISTORY: 1n << 13n,
  MENTION_EVERYONE: 1n << 14n,
  USE_EXTERNAL_EMOJIS: 1n << 15n,
  ADD_REACTIONS: 1n << 16n,
  MANAGE_MESSAGES: 1n << 17n,
  PIN_MESSAGES: 1n << 18n,
  USE_STICKERS: 1n << 19n,

  // Voice
  CONNECT: 1n << 20n,
  SPEAK: 1n << 21n,
  VIDEO: 1n << 22n,
  MUTE_MEMBERS: 1n << 23n,
  DEAFEN_MEMBERS: 1n << 24n,
  MOVE_MEMBERS: 1n << 25n,
  USE_VOICE_ACTIVITY: 1n << 26n,
  PRIORITY_SPEAKER: 1n << 27n,
  STREAM: 1n << 28n
} as const;

// Default permissions for @everyone role
export const DEFAULT_PERMISSIONS =
  Permissions.SEND_MESSAGES |
  Permissions.EMBED_LINKS |
  Permissions.ATTACH_FILES |
  Permissions.READ_MESSAGE_HISTORY |
  Permissions.ADD_REACTIONS |
  Permissions.USE_EXTERNAL_EMOJIS |
  Permissions.CONNECT |
  Permissions.SPEAK |
  Permissions.VIDEO |
  Permissions.USE_VOICE_ACTIVITY |
  Permissions.STREAM |
  Permissions.CHANGE_NICKNAME |
  Permissions.CREATE_INVITE |
  Permissions.USE_STICKERS;

// All permissions
export const ALL_PERMISSIONS = Object.values(Permissions).reduce((a, b) => a | b, 0n);

export function hasPermission(userPermissions: bigint, permission: bigint): boolean {
  // Admin has all permissions
  if ((userPermissions & Permissions.ADMINISTRATOR) === Permissions.ADMINISTRATOR) {
    return true;
  }
  return (userPermissions & permission) === permission;
}

export function computePermissions(permissionStrings: string[]): bigint {
  let result = 0n;
  for (const pStr of permissionStrings) {
    try {
      result |= BigInt(pStr);
    } catch {
      // Skip invalid
    }
  }
  return result;
}

export type MemberRole = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';

export function getMemberPermissions(role: MemberRole): bigint {
  switch (role) {
    case 'OWNER':
      return ALL_PERMISSIONS;
    case 'ADMIN':
      return ALL_PERMISSIONS & ~Permissions.ADMINISTRATOR;
    case 'MODERATOR':
      return DEFAULT_PERMISSIONS | Permissions.MANAGE_MESSAGES | Permissions.KICK_MEMBERS | Permissions.MUTE_MEMBERS | Permissions.MANAGE_NICKNAMES | Permissions.PIN_MESSAGES;
    case 'MEMBER':
    default:
      return DEFAULT_PERMISSIONS;
  }
}
