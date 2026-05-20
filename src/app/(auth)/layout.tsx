export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full items-center justify-center bg-discord-darkest p-4">
      <div className="w-full max-w-md rounded-lg bg-discord-dark p-8 shadow-xl">
        {children}
      </div>
    </div>
  );
}
