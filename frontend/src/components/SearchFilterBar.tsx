interface SearchFilterBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder?: string;
  filterLabel?: string;
  onFilterClick?: () => void;
}

export function SearchFilterBar({
  query,
  onQueryChange,
  placeholder = 'Tìm kiếm...',
  filterLabel = 'Lọc',
  onFilterClick,
}: SearchFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 md:max-w-md">
        <span className="text-slate-400">⌕</span>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          placeholder={placeholder}
        />
      </div>
      <button
        type="button"
        onClick={onFilterClick}
        className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        {filterLabel}
      </button>
    </div>
  );
}
