export default function Pagination({ page, totalPages, totalCount, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 py-6 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Stats */}
      <div className="text-sm text-ink/60">
        Showing <span className="font-semibold text-ink">page {page}</span> of{' '}
        <span className="font-semibold text-ink">{totalPages}</span> ({totalCount} total)
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="btn btn-secondary btn-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        <div className="flex items-center gap-2 px-3 py-2 bg-paper-dim rounded-lg">
          <span className="text-sm font-mono text-ink/60">
            <span className="font-bold text-ink">{page}</span> / {totalPages}
          </span>
        </div>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="btn btn-secondary btn-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
