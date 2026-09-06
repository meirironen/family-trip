import { useEffect, useRef, type ReactNode } from 'react';

export default function SavedPlacesDialog({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    return () => element.close();
  }, []);

  return (
    <dialog ref={dialog} className="saved-dialog" aria-labelledby="saved-title" onCancel={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="saved-dialog__body">
        <header className="sheet__head">
          <h2 id="saved-title">טרם שובצו</h2>
          <button type="button" className="sheet__close" aria-label="סגירה" onClick={onClose}>×</button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
