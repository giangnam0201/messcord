'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Shield, Plus, Trash2, Save, Users, Hash, Settings as SettingsIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Role = {
  id: string;
  name: string;
  color: string;
  position: number;
  permissions: string;
  isDefault: boolean;
  _count?: { users: number };
};

type Member = {
  id: string;
  userId: string;
  role: string;
  nickname: string | null;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
};

export default function ServerSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const serverId = params.serverId as string;

  const [tab, setTab] = useState<'roles' | 'members'>('roles');
  const [roles, setRoles] = useState<Role[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New role form
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#99AAB5');
  const [creatingRole, setCreatingRole] = useState(false);

  // Fetch data
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [rolesRes, membersRes] = await Promise.all([
          fetch(`/api/servers/${serverId}/roles`),
          fetch(`/api/servers/${serverId}/members`)
        ]);

        if (rolesRes.ok) {
          const data = await rolesRes.json();
          setRoles(data.roles || []);
        }
        if (membersRes.ok) {
          const data = await membersRes.json();
          setMembers(data.members || []);
        }
      } catch {
        setError('Failed to load server settings');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [serverId]);

  async function createRole() {
    if (!newRoleName.trim()) return;
    setCreatingRole(true);
    try {
      const res = await fetch(`/api/servers/${serverId}/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoleName.trim(), color: newRoleColor })
      });
      if (res.ok) {
        const data = await res.json();
        setRoles((prev) => [...prev, data.role]);
        setNewRoleName('');
        setNewRoleColor('#99AAB5');
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Failed to create role');
      }
    } finally {
      setCreatingRole(false);
    }
  }

  async function updateMemberRole(memberId: string, newRole: string) {
    // Optimistic update
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );

    // TODO: API call to update member role
    // For now this is optimistic only
  }

  async function kickMember(userId: string) {
    if (!confirm('Are you sure you want to kick this member?')) return;
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
    // TODO: API call
  }

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-discord-dark">
      {/* Header */}
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-discord-darkest px-4 shadow-sm">
        <button
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <SettingsIcon className="h-5 w-5 text-zinc-500" />
        <h1 className="text-sm font-semibold text-zinc-50">Server Settings</h1>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar nav */}
        <nav className="w-48 shrink-0 border-r border-zinc-800 bg-discord-darker p-3">
          <button
            onClick={() => setTab('roles')}
            className={`flex w-full items-center gap-2 rounded px-3 py-2 text-sm ${
              tab === 'roles' ? 'bg-zinc-700/60 text-zinc-50' : 'text-zinc-400 hover:bg-zinc-700/30 hover:text-zinc-200'
            }`}
          >
            <Shield className="h-4 w-4" />
            Roles
          </button>
          <button
            onClick={() => setTab('members')}
            className={`flex w-full items-center gap-2 rounded px-3 py-2 text-sm ${
              tab === 'members' ? 'bg-zinc-700/60 text-zinc-50' : 'text-zinc-400 hover:bg-zinc-700/30 hover:text-zinc-200'
            }`}
          >
            <Users className="h-4 w-4" />
            Members
          </button>
        </nav>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-discord-accent border-t-transparent" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-400">{error}</p>
          ) : tab === 'roles' ? (
            <RolesTab
              roles={roles}
              newRoleName={newRoleName}
              setNewRoleName={setNewRoleName}
              newRoleColor={newRoleColor}
              setNewRoleColor={setNewRoleColor}
              creatingRole={creatingRole}
              createRole={createRole}
            />
          ) : (
            <MembersTab
              members={members}
              roles={roles}
              onChangeRole={updateMemberRole}
              onKick={kickMember}
            />
          )}
        </div>
      </div>
    </section>
  );
}

// ============ Roles Tab ============

function RolesTab({
  roles,
  newRoleName,
  setNewRoleName,
  newRoleColor,
  setNewRoleColor,
  creatingRole,
  createRole
}: {
  roles: Role[];
  newRoleName: string;
  setNewRoleName: (v: string) => void;
  newRoleColor: string;
  setNewRoleColor: (v: string) => void;
  creatingRole: boolean;
  createRole: () => void;
}) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-zinc-50">Roles</h2>
      <p className="mb-4 text-sm text-zinc-400">
        Use roles to organize your server members and customize their permissions.
      </p>

      {/* Create new role */}
      <div className="mb-6 rounded-lg border border-zinc-700 bg-discord-darker p-4">
        <h3 className="mb-3 text-sm font-medium text-zinc-200">Create New Role</h3>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-zinc-400">Name</label>
            <Input
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="new role"
              maxLength={64}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-zinc-400">Color</label>
            <input
              type="color"
              value={newRoleColor}
              onChange={(e) => setNewRoleColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border border-zinc-700 bg-transparent"
            />
          </div>
          <Button onClick={createRole} disabled={creatingRole || !newRoleName.trim()}>
            <Plus className="mr-1 h-4 w-4" />
            {creatingRole ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </div>

      {/* Existing roles */}
      <div className="space-y-2">
        {roles.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-500">No roles created yet.</p>
        ) : (
          roles.map((role) => (
            <div
              key={role.id}
              className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-discord-darker px-4 py-3"
            >
              <div
                className="h-4 w-4 rounded-full border border-zinc-600"
                style={{ backgroundColor: role.color }}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-100" style={{ color: role.color }}>
                  {role.name}
                </p>
                <p className="text-xs text-zinc-500">
                  {role._count?.users ?? 0} members
                  {role.isDefault && ' • Default role'}
                </p>
              </div>
              {!role.isDefault && (
                <button className="text-zinc-500 hover:text-red-400 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ============ Members Tab ============

function MembersTab({
  members,
  roles,
  onChangeRole,
  onKick
}: {
  members: Member[];
  roles: Role[];
  onChangeRole: (memberId: string, role: string) => void;
  onKick: (userId: string) => void;
}) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-zinc-50">
        Members ({members.length})
      </h2>

      <div className="space-y-1">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-zinc-800/50"
          >
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-discord-accent text-xs font-semibold text-white">
              {member.user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                (member.user.displayName || member.user.username).slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-100">
                {member.nickname || member.user.displayName || member.user.username}
              </p>
              <p className="text-xs text-zinc-500">@{member.user.username}</p>
            </div>

            {/* Role selector */}
            <select
              value={member.role}
              onChange={(e) => onChangeRole(member.id, e.target.value)}
              disabled={member.role === 'OWNER'}
              className="rounded border border-zinc-700 bg-discord-darker px-2 py-1 text-xs text-zinc-300 focus:border-discord-accent focus:outline-none disabled:opacity-50"
            >
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Admin</option>
              <option value="MODERATOR">Moderator</option>
              <option value="MEMBER">Member</option>
            </select>

            {member.role !== 'OWNER' && (
              <button
                onClick={() => onKick(member.userId)}
                className="rounded p-1 text-zinc-500 hover:bg-red-500/20 hover:text-red-400"
                title="Kick member"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
