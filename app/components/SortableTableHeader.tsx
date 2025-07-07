interface SortableTableHeaderProps {
  label: string;
  sortKey: string;
  currentSortBy: string;
  currentSortDirection: 'asc' | 'desc';
  onSort: (sortBy: string, direction: 'asc' | 'desc') => void;
  className?: string;
  t?: Record<string, unknown>;
}

export default function SortableTableHeader({
  label,
  sortKey,
  currentSortBy,
  currentSortDirection,
  onSort,
  className = "p-1 text-left"
}: SortableTableHeaderProps) {
  const isActive = currentSortBy === sortKey;
  
  const handleClick = () => {
    // If clicking on the same column, toggle direction; otherwise sort ascending
    const newDirection = isActive && currentSortDirection === 'asc' ? 'desc' : 'asc';
    onSort(sortKey, newDirection);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <th 
      className={`${className} cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors select-none text-gray-900 dark:text-gray-100`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Sort by ${label} ${isActive && currentSortDirection === 'asc' ? 'descending' : 'ascending'}`}
      title={`Sort by ${label} ${isActive && currentSortDirection === 'asc' ? 'descending' : 'ascending'}`}
    >
      <div className="flex items-center gap-1">
        <span>{label}</span>
        <div className="flex flex-col ml-1">
          {/* Up arrow */}
          <svg 
            className={`w-3 h-3 transition-colors ${
              isActive && currentSortDirection === 'asc' 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-400 dark:text-gray-500'
            }`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          {/* Down arrow */}
          <svg 
            className={`w-3 h-3 -mt-1 transition-colors ${
              isActive && currentSortDirection === 'desc' 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-gray-400 dark:text-gray-500'
            }`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </th>
  );
} 