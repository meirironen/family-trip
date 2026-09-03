# מסלול הטיול — צפון איטליה

PWA קטן לשיתוף מסלול הטיול, 22–30 בספטמבר 2026.
עברית, RTL, רספונסיבי. React + TypeScript + Vite, נפרס ב-Vercel.

כל אחד מהנוסעים יכול להוסיף מקומות, לגרור אותם ליום המתאים, ולסמן מה כבר עשינו.
המצב משותף לכל מי שנכנס לקישור.

## הרצה

```bash
npm install
npm run dev          # http://localhost:5173
npm run typecheck    # tsc --noEmit
npm test             # בדיקות הלוגיקה (רצות ישירות על ה-TS, בלי קומפילציה)
npm run build        # typecheck ואז build
```

בלי שרת האפליקציה נופלת ל-localStorage וממשיכה לעבוד (הכותרת תציג "מקומי בלבד").
לסנכרון אמיתי בפיתוח: `npx vercel dev` (מריץ את `/api` על :3000, ו-vite מפנה אליו).

## פריסה

1. `npx vercel link`, או Import ב-dashboard. ה-framework הוא Vite.
2. Settings → Environment Variables, לכל הסביבות:

   | Name | |
   |---|---|
   | `UPSTASH_REDIS_REST_URL` | מ-Upstash |
   | `UPSTASH_REDIS_REST_TOKEN` | מ-Upstash |
   | `TRIP_KEY` *(אופציונלי)* | `trip:italy2026` |

3. Deploy.

## מבנה

```
index.html                שלד הדף (RTL, manifest, meta של PWA)
src/main.tsx              נקודת כניסה + רישום service worker
src/App.tsx               הרכבת המסך, פילטרים, מצב עריכה
src/trip.ts               ← הקובץ היחיד שצריך לערוך + כל הטיפוסים של הדומיין
src/lib/state.ts          לוגיקה טהורה: נרמול, העברות, בניית קישורים
src/lib/useTripState.ts   טעינה/שמירה/פולינג מול /api/state
src/lib/useDragDrop.ts    גרירה בעכבר ובמגע, בלי ספרייה
src/components/           Header, Column, PlaceCard, PlaceEditor
api/state.ts              פונקציית Vercel — קריאה/כתיבה ל-Upstash Redis
public/                   manifest, service worker, אייקונים
test/state.test.ts        11 בדיקות ל-src/lib/state.ts
```

## הטיפוסים המרכזיים

הכול ב-`src/trip.ts`:

```ts
type AreaKey   = 'garda' | 'dolomites' | 'milan';
type TypeKey   = 'hotel' | 'attraction' | 'hike' | 'food' | 'drive';
type DayId     = 'd1' | … | 'd9';
type ColumnId  = 'pool' | DayId;
interface Place { id; he; orig?; type: TypeKey; area: AreaKey; dur?; notes?; maps?; site? }
```

ו-`TripState` ב-`src/lib/state.ts`:

```ts
interface TripState {
  order:   Record<ColumnId, PlaceId[]>;   // מה נמצא בכל יום, לפי הסדר
  meta:    Record<PlaceId, Partial<Place>>; // עריכות מתוך האתר
  custom:  Place[];                        // מקומות שהוספנו
  removed: PlaceId[];
  done:    Record<PlaceId, true>;
}
```

`ColumnId` הוא union, כך שיום שלא קיים לא יעבור קומפילציה — וגם `movePlace` בודק אותו
בזמן ריצה, כי המצב מגיע מהרשת.

## עריכת המקומות

`src/trip.ts`:

- `MAP_URL` — **הקישור לרשימת Google Maps שלנו.** ריק כרגע, ולכן כפתור "המפה שלנו" מוסתר.
- `DAYS`, `AREAS`, `TYPES`, `PLACES`.

אפשר גם להוסיף ולערוך מקומות מתוך האתר; העריכות נשמרות ב-`meta` ודורסות את `trip.ts`.

## איך הסנכרון עובד

מסמך יחיד ב-Redis: `{ rev, data }`. כל שמירה שולחת את ה-`rev` שעליו התבססה; אם מישהו
הספיק לשמור לפני, השרת מחזיר 409 עם המצב העדכני והאפליקציה מאמצת אותו. כל 8 שניות
נבדק אם מישהו אחר שינה משהו. מחיקת המפתח ב-Upstash מאפסת את הלוח בחזרה ל-`trip.ts`.

## אבטחה

- אין סודות בצד הלקוח — ה-token רק במשתני הסביבה של הפונקציה.
- `isHttpUrl` הוא type guard: קישור שמשתמש הזין מגיע ל-DOM רק אחרי שעבר אותו,
  כך ש-`javascript:` לא יכול להיכנס ל-href. הטיפוסים אוכפים את זה, לא רק המוסכמה.
- ה-API מוגבל ל-256KB לבקשה ומחזיר שגיאה גנרית, בלי פרטי חיבור.
- `normalize` לא סומך על מה שחוזר מהרשת ומתקן כל מצב פגום.
- ה-service worker לעולם לא מאחסן `/api/*`.

> הקישור עצמו הוא ההרשאה — מי שיש לו את הכתובת יכול לערוך. מתאים לקבוצה סגורה;
> אם צריך יותר, אפשר להוסיף Vercel Password Protection.
