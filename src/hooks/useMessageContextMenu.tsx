'use client';

import {
  Reply,
  Pencil,
  Trash2,
  Pin,
  Copy,
  Hash,
  Smile,
  Link as LinkIcon,
  Flag
} from 'lucide-react';
import { useContextMenu, type ContextMenuItem } from '@/components/ContextMenu';
import type { ChatMessage } from '@/components/MessageList';

export function useMessageContextMenu({
  currentUserId,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onReact
}: {
  currentUserId: string;
  onReply?: (message: ChatMessage) => void;
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
}) {
  const { show } = useContextMenu();

  function showMessageMenu(e: React.MouseEvent, message: ChatMessage) {
    const isAuthor = message.author.id === currentUserId;
    const isTemp = message.id.startsWith('tmp_');

    const items: ContextMenuItem[] = [
      {
        id: 'react',
        label: 'Add Reaction',
        icon: <Smile className="h-4 w-4" />,
        onClick: () => onReact?.(message.id, '👍')
      },
      {
        id: 'reply',
        label: 'Reply',
        icon: <Reply className="h-4 w-4" />,
        onClick: () => onReply?.(message)
      },
      { separator: true },
      {
        id: 'copy-text',
        label: 'Copy Text',
        icon: <Copy className="h-4 w-4" />,
        shortcut: 'Ctrl+C',
        onClick: () => {
          navigator.clipboard.writeText(message.content);
        }
      },
      {
        id: 'copy-link',
        label: 'Copy Message Link',
        icon: <LinkIcon className="h-4 w-4" />,
        onClick: () => {
          navigator.clipboard.writeText(window.location.href + '?msg=' + message.id);
        }
      },
      {
        id: 'copy-id',
        label: 'Copy Message ID',
        icon: <Hash className="h-4 w-4" />,
        onClick: () => {
          navigator.clipboard.writeText(message.id);
        }
      }
    ];

    // Author-only actions
    if (isAuthor && !isTemp) {
      items.splice(2, 0, {
        id: 'edit',
        label: 'Edit Message',
        icon: <Pencil className="h-4 w-4" />,
        shortcut: 'E',
        onClick: () => onEdit?.(message)
      });
    }

    // Pin (everyone can see it, but only with permission should pin)
    items.push({ separator: true });
    items.push({
      id: 'pin',
      label: 'Pin Message',
      icon: <Pin className="h-4 w-4" />,
      onClick: () => onPin?.(message.id)
    });

    // Delete (author or admin)
    if (isAuthor && !isTemp) {
      items.push({ separator: true });
      items.push({
        id: 'delete',
        label: 'Delete Message',
        icon: <Trash2 className="h-4 w-4" />,
        danger: true,
        onClick: () => onDelete?.(message.id)
      });
    }

    // Report (if not author)
    if (!isAuthor) {
      items.push({ separator: true });
      items.push({
        id: 'report',
        label: 'Report Message',
        icon: <Flag className="h-4 w-4" />,
        danger: true,
        onClick: () => {
          // Future: report flow
          alert('Report submitted (placeholder)');
        }
      });
    }

    show(e, items);
  }

  return { showMessageMenu };
}
