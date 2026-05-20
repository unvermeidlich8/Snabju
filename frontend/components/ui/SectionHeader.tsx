interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, action, onAction }: SectionHeaderProps) {
  return (
    <div className="flex items-baseline justify-between px-4 mb-2.5">
      <h2 className="m-0 font-sans text-xl font-bold text-ink" style={{ letterSpacing: '-0.5px' }}>
        {title}
      </h2>
      {action && (
        <button
          onClick={onAction}
          className="text-[13px] text-accent font-semibold cursor-pointer bg-transparent border-0 p-0"
        >
          {action} →
        </button>
      )}
    </div>
  );
}