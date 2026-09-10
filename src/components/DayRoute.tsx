import DrivingTotal from './DrivingTotal.tsx';
import { useEffect, useRef, useState } from 'react';
import { hotelOf, resolvePlace, type TripState } from '../lib/state.ts';
import { dayRouteLinks } from '../lib/dayRoute.ts';
import type { ColumnDef, Place } from '../trip.ts';

export default function DayRoute({ state, column, onClose }: {
  state: TripState; column: ColumnDef; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const hotel = hotelOf(state, column.id);
  const [start, setStart] = useState(hotel ? 'hotel' : 'current');
  const [address, setAddress] = useState('');
  const places = state.order[column.id].map((id) => resolvePlace(state, id)).filter((p): p is Place => p !== null);
  const name = (p: Place) => p.orig || p.he;
  const origin = start === 'hotel' && hotel ? name(hotel) : start === 'custom' ? address.trim() : start === 'first' && places[0] ? name(places[0]) : null;
  const stops = start === 'first' || (start === 'hotel' && hotel?.id === places[0]?.id) ? places.slice(1) : places;
  const links = start === 'custom' && !address.trim() ? [] : dayRouteLinks(stops.map(name), origin);

  useEffect(() => {
    const el = dialog.current!;
    el.showModal();
    return () => el.close();
  }, []);

  return (
    <dialog ref={dialog} className="day-route" aria-labelledby="day-route-title" onCancel={onClose} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="day-route__body">
        <div className="sheet__head">
          <h2 id="day-route-title">מסלול ליום {column.title}</h2>
          <button type="button" className="sheet__close" aria-label="סגירה" onClick={onClose}>×</button>
        </div>
        <div className="field">
          <label htmlFor="route-start">נקודת התחלה</label>
          <select id="route-start" value={start} onChange={(e) => setStart(e.target.value)}>
            <option value="current">המיקום שלי</option>
            {hotel && <option value="hotel">המלון של היום — {hotel.he}</option>}
            <option value="first">המקום הראשון ביום</option>
            <option value="custom">כתובת או מקום אחר</option>
          </select>
        </div>
        {start === 'custom' && <div className="field">
          <label htmlFor="route-address">כתובת או שם מקום</label>
          <input id="route-address" value={address} maxLength={200} onChange={(e) => setAddress(e.target.value)} placeholder="למשל: נמל התעופה מלפנסה, איטליה" />
        </div>}
        {start === 'current' && <p className="sheet__note">Google Maps ישתמש במיקום שלכם, או יבקש נקודת התחלה.</p>}
        <p className="sheet__note">כל מקומות היום לפי הסדר בלוח, כולל מקומות שהוסתרו במסנן.</p>
        <DrivingTotal state={state} day={column.id} />
        <p className="sheet__note">זמני הנסיעה הידניים כוללים רק מקטעים בין מקומות בלוח, ללא נסיעה מנקודת התחלה נוספת.</p>
        <ol className="day-route__stops">{places.map((p) => <li key={p.id}>{p.he}</li>)}</ol>
        {!places.length && <p>אין עדיין מקומות ביום הזה.</p>}
        {start === 'first' && places.length === 1 && <p>הוסיפו מקום נוסף למסלול או בחרו נקודת התחלה אחרת.</p>}
        {links.length > 1 && <p className="sheet__note">המסלול מחולק לחלקים כדי לכלול את כל העצירות גם בנייד. פתחו אותם לפי הסדר.</p>}
        <div className="day-route__links">{links.map((url, i) => <a className="btn btn--primary" key={url} href={url} target="_blank" rel="noopener noreferrer">
          {links.length === 1 ? 'פתיחת המסלול ב-Google Maps ↗' : `פתיחת חלק ${i + 1} מתוך ${links.length} ↗`}
        </a>)}</div>
      </div>
    </dialog>
  );
}
