export default function ChannelLoading() {
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-discord-dark animate-pulse">
      {/* Header skeleton */}
      <div className="flex h-12 items-center border-b border-discord-darkest px-4 shadow-sm">
        <div className="h-5 w-5 rounded bg-zinc-700/60" />
        <div className="ml-2 h-4 w-32 rounded bg-zinc-700/60" />
      </div>

      {/* Messages area skeleton */}
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-700/60" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-24 rounded bg-zinc-700/60" />
                <div className="h-3 w-16 rounded bg-zinc-800/60" />
              </div>
              <div className="h-4 w-3/4 rounded bg-zinc-700/40" />
              {i % 2 === 0 && <div className="h-4 w-1/2 rounded bg-zinc-700/40" />}
            </div>
          </div>
        ))}
      </div>

      {/* Message input skeleton */}
      <div className="p-4 pt-0">
        <div className="h-11 w-full rounded-lg bg-zinc-700/40" />
      </div>
    </div>
  );
}
