'use client';

import {
  Pencil,
  BellOff,
  Bell,
  CheckCheck,
  Hash,
  Trash2,
  Copy,
  Link as LinkIcon,
  Settings
} from 'lucide-react';
import { useContextMenu, type ContextMenuItem } from '@/components/ContextMenu';

type ChannelTarget = {
  id: string;
  name: string;
  type: 'TEXT' | 'VOICE' | 'VIDEO' | 'ANNOUNCEMENT';
};

export function useChannelContextMenu({
  isOwner,
  onEdit,
  onDelete,
  onMute
}: {
  isOwner: boolean;
  onEdit?: (channelId: string) => void;
  onDelete?: (channelId: string) => void;
  onMute?: (channelId: string) => void;
}) {
  const { show } = useContextMenu();

  function showChannelMenu(e: React.MouseEvent, channel: ChannelTarget) {
    const items: ContextMenuItem[] = [
      {
        id: 'mark-read',
        label: 'Mark As Read',
        icon: <CheckCheck className="h-4 w-4" />,
        onClick: () => {
          // Placeholder
        }
      },
      { separator: true },
      {
        id: 'mute',
        label: 'Mute Channel',
        icon: <BellOff className="h-4 w-4" />,
        onClick: () => onMute?.(channel.id)
      },
      {
        id: 'notification-settings',
        label: 'Notification Settings',
        icon: <Bell className="h-4 w-4" />,
        onClick: () => {
          // Placeholder
        }
      }
    ];

    if (isOwner) {
      items.push({ separator: true });
      items.push({
        id: 'edit',
        label: 'Edit Channel',
        icon: <Pencil className="h-4 w-4" />,
        onClick: () => onEdit?.(channel.id)
      });
      items.push({
        id: 'delete',
        label: 'Delete Channel',
        icon: <Trash2 className="h-4 w-4" />,
        danger: true,
        onClick: () => onDelete?.(channel.id)
      });
    }

    items.push({ separator: true });
    items.push({
      id: 'copy-link',
      label: 'Copy Channel Link',
      icon: <LinkIcon className="h-4 w-4" />,
      onClick: () => {
        navigator.clipboard.writeText(window.location.origin + `/channels/${channel.id}`);
      }
    });
    items.push({
      id: 'copy-id',
      label: 'Copy Channel ID',
      icon: <Hash className="h-4 w-4" />,
      onClick: () => {
        navigator.clipboard.writeText(channel.id);
      }
    });

    show(e, items);
  }

  return { showChannelMenu };
}
