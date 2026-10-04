export default function ServerLoading() {
  return (
    <div className="flex h-full min-w-0 flex-1 flex-row bg-discord-dark animate-pulse">
      {/* Channel sidebar skeleton */}
      <div className="hidden h-full w-60 flex-col bg-discord-darker md:flex">
        <div className="flex h-12 items-center border-b border-discord-darkest px-4">
          <div className="h-4 w-32 rounded bg-zinc-700/60" />
        </div>
        <div className="flex-1 space-y-3 p-3">
          <div className="h-3 w-20 rounded bg-zinc-800/60" />
          <div className="h-7 w-full rounded bg-zinc-700/40" />
          <div className="h-7 w-full rounded bg-zinc-700/40" />
          <div className="h-7 w-full rounded bg-zinc-700/40" />
        </div>
      </div>
      {/* Main panel skeleton */}
      <div className="flex h-full min-w-0 flex-1 flex-col bg-discord-dark p-4">
        <div className="h-12 border-b border-discord-darkest" />
      </div>
    </div>
  );
}
