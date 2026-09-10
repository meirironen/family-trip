import { useEffect, useRef, useState } from 'react';
import { TYPES, type TypeKey } from '../trip.ts';
import { duplicateStatus, MAX_IMPORT_BYTES, parsePlaceCsv, type ImportRow } from '../lib/placeImport.ts';
import type { TripState } from '../lib/state.ts';

interface Props {
  state: TripState;
  onImport: (rows: ImportRow[]) => { added: number; skipped: number };
  onClose: () => void;
  onViewPlaces: () => void;
}
type Draft = ImportRow & { selected: boolean };

export default function PlaceImport({ state, onImport, onClose, onViewPlaces }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [rows, setRows] = useState<Draft[]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);
  const [bulkType, setBulkType] = useState<TypeKey | ''>('');
  const [bulkArea, setBulkArea] = useState('');
  const fileVersion = useRef(0);

  useEffect(() => {
    const el = dialog.current!;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    el.showModal();
    document.body.style.overflow = 'hidden';
    return () => { fileVersion.current++; el.close(); document.body.style.overflow = overflow; opener?.focus(); };
  }, []);

  async function readFile(file: File | undefined) {
    if (!file) return;
    const version = ++fileVersion.current;
    setRows([]); setError(''); setResult(null); setFileName(file.name); setLoading(true);
    setBulkType(''); setBulkArea('');
    try {
      if (!file.name.toLowerCase().endsWith('.csv')) throw new Error('חלצו את קובץ ה-CSV מתוך הייצוא והעלו אותו כאן.');
      if (file.size > MAX_IMPORT_BYTES) throw new Error('הקובץ גדול מדי. הגודל המרבי הוא 1MB.');
      const parsed = parsePlaceCsv(await file.text());
      if (version !== fileVersion.current) return;
      setRows(parsed.map((row) => ({ ...row, area: Object.hasOwn(state.areas, row.area) ? row.area : '', selected: !duplicateStatus(state, row) })));
    } catch (err) {
      if (version === fileVersion.current) setError(err instanceof Error ? err.message : 'לא ניתן לקרוא את הקובץ.');
    } finally { if (version === fileVersion.current) setLoading(false); }
  }

  const statuses = rows.map((row) => duplicateStatus(state, row));
  const selected = rows.filter((row, i) => row.selected && !statuses[i]);
  const incomplete = selected.some((row) => !row.type || !Object.hasOwn(state.areas, row.area));
  const patch = (index: number, value: Partial<Draft>) => setRows((current) => current.map((r, i) => i === index ? { ...r, ...value } : r));
  const applyBulk = (value: Partial<ImportRow>) => setRows((current) => current.map((r) => r.selected && !duplicateStatus(state, r) ? { ...r, ...value } : r));

  return (
    <dialog ref={dialog} className="pool-modal import-modal" aria-labelledby="import-title"
      onCancel={(e) => { e.preventDefault(); onClose(); }}>
      <div className="pool-modal__content">
        <header className="pool-modal__head">
          <div><h2 id="import-title">ייבוא מקומות</h2><p>בוחרים מה להוסיף לפני השמירה</p></div>
          <button className="btn" type="button" aria-label="סגירת ייבוא" onClick={onClose}>✕</button>
        </header>
        <div className="pool-modal__list import-body">
          <div className="import-upload">
            <label className="field">קובץ CSV של רשימת Google Maps
              <input type="file" accept=".csv,text/csv" onChange={(e) => { void readFile(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
            <p>העלו CSV שחולץ מהייצוא. שמות, הערות וקישורים יופיעו לבדיקה. בחרו סוג ואזור לכל מקום שתרצו להוסיף.</p>
            <a href="/examples/places.csv" download>הורדת קובץ לדוגמה</a>
          </div>
          {loading && <p role="status">קורא את הקובץ…</p>}
          {error && <p className="import-error" role="alert">{error}</p>}
          {result ? (
            <div className="import-success" role="status">
              <h3>נוספו {result.added} מקומות לרשימת טרם שובצו</h3>
              <p>{result.skipped > 0 ? `${result.skipped} כפילויות דולגו. ` : ''}אפשר כעת לערוך ולשבץ אותם לימים. מצב השמירה מופיע בכותרת האפליקציה.</p>
              <button className="btn btn--primary" type="button" onClick={onViewPlaces}>לצפייה במקומות</button>
            </div>
          ) : rows.length > 0 && <>
            <p className="import-summary"><b>{fileName}</b> · {rows.length} מקומות · {statuses.filter(Boolean).length} כבר קיימים או נמחקו</p>
            <div className="import-bulk">
              <div className="import-selection">
                <button className="btn" type="button" onClick={() => setRows((current) => current.map((r) => ({ ...r, selected: !duplicateStatus(state, r) })))}>בחירת הכל</button>
                <button className="btn" type="button" onClick={() => setRows((current) => current.map((r) => ({ ...r, selected: false })))}>ניקוי בחירה</button>
              </div>
              <label className="field">סוג לכל המסומנים
                <select value={bulkType} onChange={(e) => { const type = e.target.value as TypeKey | ''; setBulkType(type); if (type) applyBulk({ type }); }}>
                  <option value="">בחירת סוג</option>
                  {Object.entries(TYPES).map(([id, t]) => <option key={id} value={id}>{t.icon} {t.he}</option>)}
                </select>
              </label>
              <label className="field">אזור לכל המסומנים
                <select value={bulkArea} onChange={(e) => { setBulkArea(e.target.value); if (e.target.value) applyBulk({ area: e.target.value }); }}>
                  <option value="">בחירת אזור</option>
                  {Object.entries(state.areas).map(([id, area]) => <option key={id} value={id}>{area.he}</option>)}
                </select>
              </label>
            </div>
            <p className="import-hint">סיווג לא ידוע דורש בחירה. קישורים מקוצרים שונים לאותו מקום עשויים לדרוש ביטול בחירה ידני.</p>
            <div className="import-rows">
              {rows.map((row, index) => <article className={`import-row${statuses[index] ? ' import-row--duplicate' : ''}`} key={index}>
                <label className="import-row__name">
                  <input type="checkbox" checked={row.selected && !statuses[index]} disabled={!!statuses[index]} onChange={(e) => patch(index, { selected: e.target.checked })} />
                  <b dir="auto">{row.name}</b>
                </label>
                {statuses[index] && <span className="import-badge">{statuses[index] === 'removed' ? 'נמחק בעבר — ידולג' : 'כבר קיים — ידולג'}</span>}
                {row.notes && <p className="import-note" dir="auto">{row.notes}</p>}
                {row.maps && <a href={row.maps} target="_blank" rel="noopener noreferrer">פתיחה במפה ↗</a>}
                <div className="import-row__fields">
                  <label className="field">סוג
                    <select aria-label={`סוג של ${row.name}`} value={row.type} disabled={!!statuses[index]} onChange={(e) => patch(index, { type: e.target.value as TypeKey | '' })}>
                      <option value="">בחירת סוג</option>
                      {Object.entries(TYPES).map(([id, t]) => <option key={id} value={id}>{t.icon} {t.he}</option>)}
                    </select>
                  </label>
                  <label className="field">אזור
                    <select aria-label={`אזור של ${row.name}`} value={row.area} disabled={!!statuses[index]} onChange={(e) => patch(index, { area: e.target.value })}>
                      <option value="">בחירת אזור</option>
                      {Object.entries(state.areas).map(([id, area]) => <option key={id} value={id}>{area.he}</option>)}
                    </select>
                  </label>
                </div>
              </article>)}
            </div>
          </>}
        </div>
        {!result && <footer className="import-footer">
          <p>{selected.length} מקומות מסומנים{incomplete ? ' · יש להשלים סוג ואזור' : ''}</p>
          <button type="button" className="btn btn--primary" disabled={!selected.length || incomplete || loading} onClick={() => {
            try { setError(''); setResult(onImport(selected)); }
            catch (err) { setError(err instanceof Error ? err.message : 'הייבוא נכשל.'); }
          }}>ייבוא {selected.length} מקומות</button>
        </footer>}
      </div>
    </dialog>
  );
}
