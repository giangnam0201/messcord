'use client';

import {
  User,
  MessageSquare,
  UserPlus,
  UserMinus,
  Shield,
  Ban,
  Hash,
  Volume2,
  VolumeX,
  Crown
} from 'lucide-react';
import { useContextMenu, type ContextMenuItem } from '@/components/ContextMenu';

type UserTarget = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export function useUserContextMenu({
  currentUserId,
  onViewProfile,
  onMessage,
  onAddFriend,
  onKick,
  onBan
}: {
  currentUserId: string;
  onViewProfile?: (user: UserTarget) => void;
  onMessage?: (user: UserTarget) => void;
  onAddFriend?: (userId: string) => void;
  onKick?: (userId: string) => void;
  onBan?: (userId: string) => void;
}) {
  const { show } = useContextMenu();

  function showUserMenu(e: React.MouseEvent, user: UserTarget, options?: { isOwner?: boolean; isAdmin?: boolean }) {
    const isSelf = user.id === currentUserId;

    const items: ContextMenuItem[] = [
      {
        id: 'profile',
        label: 'Profile',
        icon: <User className="h-4 w-4" />,
        onClick: () => onViewProfile?.(user)
      }
    ];

    if (!isSelf) {
      items.push({
        id: 'message',
        label: 'Message',
        icon: <MessageSquare className="h-4 w-4" />,
        onClick: () => onMessage?.(user)
      });
      items.push({ separator: true });
      items.push({
        id: 'add-friend',
        label: 'Add Friend',
        icon: <UserPlus className="h-4 w-4" />,
        onClick: () => onAddFriend?.(user.id)
      });
    }

    items.push({ separator: true });
    items.push({
      id: 'mute',
      label: 'Mute',
      icon: <VolumeX className="h-4 w-4" />,
      onClick: () => {
        // Placeholder for mute functionality
      }
    });

    // Moderation actions (only if current user is owner/admin)
    if (!isSelf && (options?.isOwner || options?.isAdmin)) {
      items.push({ separator: true });
      items.push({
        id: 'kick',
        label: 'Kick ' + (user.displayName || user.username),
        icon: <UserMinus className="h-4 w-4" />,
        danger: true,
        onClick: () => onKick?.(user.id)
      });
      items.push({
        id: 'ban',
        label: 'Ban ' + (user.displayName || user.username),
        icon: <Ban className="h-4 w-4" />,
        danger: true,
        onClick: () => onBan?.(user.id)
      });
    }

    items.push({ separator: true });
    items.push({
      id: 'copy-username',
      label: 'Copy Username',
      icon: <Hash className="h-4 w-4" />,
      onClick: () => {
        navigator.clipboard.writeText(user.username);
      }
    });
    items.push({
      id: 'copy-id',
      label: 'Copy User ID',
      icon: <Hash className="h-4 w-4" />,
      onClick: () => {
        navigator.clipboard.writeText(user.id);
      }
    });

    show(e, items);
  }

  return { showUserMenu };
}
