const TYPE_STYLES = {
  success: 'surface-hero',
  error: 'bg-rose text-foam',
  pending: 'surface-shell',
};

export default function Toast({ toast, onDismiss }) {
  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 max-w-sm">
      <div
        className={`pointer-events-auto border-3 border-ink px-4 py-3 shadow-brutal ${TYPE_STYLES[toast.type] || 'surface-card'}`}
        role="status"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="font-mono text-sm font-semibold">{toast.message}</p>
          {toast.type !== 'pending' && (
            <button
              type="button"
              className="font-mono text-xs uppercase underline"
              onClick={onDismiss}
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
