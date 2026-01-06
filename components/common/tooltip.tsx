export const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => (
    <div className="relative flex items-center group">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] bg-background text-small text-primary rounded-md px-3 py-1.5 shadow-lg opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 ease-out pointer-events-none z-50">
        {content}
      </div>
    </div>
  );
  