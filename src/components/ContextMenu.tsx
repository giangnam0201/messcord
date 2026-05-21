'use client';

import { useEffect, useRef, useState, useCallback, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

// ============ Context Menu Types ============

export type ContextMenuItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  danger?: boolean;
  disabled?: boolean;
  separator?: false;
  onClick: () => void;
} | {
  separator: true;
  id?: string;
};

type ContextMenuState = {
  x: number;
  y: number;
  items: ContextMenuItem[];
} | null;

type ContextMenuContextType = {
  show: (e: React.MouseEvent, items: ContextMenuItem[]) => void;
  hide: () => void;
};

const ContextMenuContext = createContext<ContextMenuContextType>({
  show: () => {},
  hide: () => {}
});

export function useContextMenu() {
  return useContext(ContextMenuContext);
}

// ============ Context Menu Provider ============

export function ContextMenuProvider({ children }: { children: React.ReactNode }) {
  const [menu, setMenu] = useState<ContextMenuState>(null);

  const show = useCallback((e: React.MouseEvent, items: ContextMenuItem[]) => {
    e.preventDefault();
    e.stopPropagation();

    // Calculate position ensuring menu stays within viewport
    const x = Math.min(e.clientX, window.innerWidth - 220);
    const y = Math.min(e.clientY, window.innerHeight - 300);

    setMenu({ x, y, items });
  }, []);

  const hide = useCallback(() => {
    setMenu(null);
  }, []);

  return (
    <ContextMenuContext.Provider value={{ show, hide }}>
      {children}
      {menu && (
        <ContextMenuPopup
          x={menu.x}
          y={menu.y}
          items={menu.items}
          onClose={hide}
        />
      )}
    </ContextMenuContext.Provider>
  );
}

// ============ Context Menu Popup ============

function ContextMenuPopup({
  x,
  y,
  items,
  onClose
}: {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPos, setAdjustedPos] = useState({ x, y });

  // Adjust position if menu overflows viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      let newX = x;
      let newY = y;

      if (x + rect.width > window.innerWidth) {
        newX = window.innerWidth - rect.width - 8;
      }
      if (y + rect.height > window.innerHeight) {
        newY = window.innerHeight - rect.height - 8;
      }
      setAdjustedPos({ x: Math.max(4, newX), y: Math.max(4, newY) });
    }
  }, [x, y]);

  // Close on click outside or Escape
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    function handleScroll() {
      onClose();
    }

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', onClose);

    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-[9999] min-w-[188px] max-w-[320px] rounded-md border border-zinc-800 bg-[#111214] p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100"
      style={{ left: adjustedPos.x, top: adjustedPos.y }}
      role="menu"
    >
      {items.map((item, idx) => {
        if ('separator' in item && item.separator) {
          return (
            <div
              key={item.id || `sep-${idx}`}
              className="my-1 h-px bg-zinc-700/60"
              role="separator"
            />
          );
        }

        const menuItem = item as Exclude<ContextMenuItem, { separator: true }>;

        return (
          <button
            key={menuItem.id}
            role="menuitem"
            disabled={menuItem.disabled}
            onClick={() => {
              if (!menuItem.disabled) {
                menuItem.onClick();
                onClose();
              }
            }}
            className={cn(
              'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors',
              menuItem.danger
                ? 'text-red-400 hover:bg-red-500/20 hover:text-red-300'
                : 'text-zinc-300 hover:bg-discord-accent/80 hover:text-white',
              menuItem.disabled && 'cursor-not-allowed opacity-40'
            )}
          >
            {menuItem.icon && (
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                {menuItem.icon}
              </span>
            )}
            <span className="flex-1 truncate">{menuItem.label}</span>
            {menuItem.shortcut && (
              <span className="ml-auto pl-4 text-xs text-zinc-500">
                {menuItem.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
