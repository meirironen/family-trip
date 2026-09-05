/**
 * Trip configuration and the starting place list.
 * This is the only file you need to edit to change days, areas or places.
 */

// ---------- types ----------

/**
 * Areas are user-editable, so this is a plain id rather than a union —
 * the set of valid areas lives in the shared state, not in the compiler.
 */
export type AreaId = string;

export interface Area {
  he: string;
  /** Hex colour of the card's edge bar. */
  color: string;
}

export type TypeKey = 'hotel' | 'attraction' | 'hike' | 'food' | 'shop' | 'drive';
export type DayId = 'd1' | 'd2' | 'd3' | 'd4' | 'd5' | 'd6' | 'd7' | 'd8' | 'd9';
export type ColumnId = 'pool' | DayId;
export type PlaceId = string;

export interface Place {
  id: PlaceId;
  /** Display name, in Hebrew. */
  he: string;
  /** Original/English name — what we search Google Maps for. */
  orig?: string;
  type: TypeKey;
  area: AreaId;
  /** Free text, e.g. "3–4 שעות". */
  dur?: string;
  notes?: string;
  /** Explicit Maps link; when absent a search link is built from `orig`. */
  maps?: string;
  site?: string;
}

export interface Day {
  id: DayId;
  /** ISO date, used to highlight "today" during the trip. */
  date: string;
  label: string;
  dow: string;
  note: string;
}

export interface ColumnDef {
  id: ColumnId;
  title: string;
  dow?: string;
  note?: string;
  date?: string;
}

export interface Labelled {
  he: string;
}

// ---------- configuration ----------

/** Link to our shared Google Maps list. Paste the list's share URL here. */
export const MAP_URL = 'https://maps.app.goo.gl/UDCx6ie5pLeBcQ6X6';

export const TITLE = 'צפון איטליה';
export const SUBTITLE = '⁦22–30⁩ בספטמבר 2026 · 13 נוסעים';

export const POOL = 'pool' as const;

export const DAYS: readonly Day[] = [
  { id: 'd1', date: '2026-09-22', label: '22.9', dow: 'שלישי', note: 'נחיתה במלפנסה' },
  { id: 'd2', date: '2026-09-23', label: '23.9', dow: 'רביעי', note: 'אגם גרדה' },
  { id: 'd3', date: '2026-09-24', label: '24.9', dow: 'חמישי', note: 'אגם גרדה' },
  { id: 'd4', date: '2026-09-25', label: '25.9', dow: 'שישי', note: 'מעבר לדולמיטים' },
  { id: 'd5', date: '2026-09-26', label: '26.9', dow: 'שבת', note: 'דולמיטים' },
  { id: 'd6', date: '2026-09-27', label: '27.9', dow: 'ראשון', note: 'דולמיטים' },
  { id: 'd7', date: '2026-09-28', label: '28.9', dow: 'שני', note: 'דולמיטים' },
  { id: 'd8', date: '2026-09-29', label: '29.9', dow: 'שלישי', note: 'חזרה למלפנסה' },
  { id: 'd9', date: '2026-09-30', label: '30.9', dow: 'רביעי', note: 'טיסה הביתה' },
];

/** Seed areas. Editable in the app; the live set lives in the shared state. */
export const DEFAULT_AREAS: Record<AreaId, Area> = {
  garda: { he: 'אגם גרדה', color: '#2f7bbd' },
  dolomites: { he: 'דולמיטים', color: '#3f8f5e' },
  verona: { he: 'ורונה', color: '#8a5fb0' },
  venice: { he: 'ונציה', color: '#3f8f8a' },
  milan: { he: 'מילאנו', color: '#a4643a' },
};

/** Palette offered when adding an area. */
export const AREA_COLORS = [
  '#2f7bbd', '#3f8f5e', '#a4643a', '#8a5fb0', '#c1913a', '#3f8f8a', '#b4552d', '#6b7280',
] as const;

/** Colour used when a place points at an area that no longer exists. */
export const FALLBACK_COLOR = '#8b8378';

export const TYPES: Record<TypeKey, Labelled & { icon: string }> = {
  hotel: { he: 'מלון', icon: '🛏' },
  attraction: { he: 'אטרקציה', icon: '◎' },
  hike: { he: 'מסלול הליכה', icon: '⛰' },
  food: { he: 'אוכל', icon: '🍽' },
  shop: { he: 'קניות', icon: '🛍' },
  drive: { he: 'נסיעה', icon: '🚐' },
};

/** Imported from our Google Maps lists. Everything starts unassigned. */
export const PLACES: readonly Place[] = [
// 48 places, imported from Google Takeout on 2026-09-04
  { id: 'p_orrido_di_ponte_alto', he: 'Orrido di Ponte Alto — קניון', orig: 'Orrido di Ponte Alto', type: 'hike', area: 'dolomites', maps: 'https://www.google.com/maps/place/Orrido+di+Ponte+Alto/data=!4m2!3m1!1s0x478276c270d6399f:0xb1b53e372bfa9261' },
  { id: 'p_cooperativa_smeraldo_canyon_', he: 'קניון ריו סאס', orig: 'Cooperativa Smeraldo - Canyon Rio Sass', type: 'hike', area: 'dolomites', notes: 'מסלול נליכה ו', maps: 'https://www.google.com/maps/place/Cooperativa+Smeraldo+-+Canyon+Rio+Sass/data=!4m2!3m1!1s0x478290271f6663e9:0x9d75b3bd9c3a8fc6' },
  { id: 'p_pragser_wildsee', he: 'אגם בראייס', orig: 'Pragser Wildsee', type: 'attraction', area: 'dolomites', notes: 'אגם רגוע', maps: 'https://www.google.com/maps/place/Pragser+Wildsee/data=!4m2!3m1!1s0x47782f7e223aede7:0xbd2db4f14d5fc2f5' },
  { id: 'p_seceda', he: 'סצ׳דה', orig: 'Seceda', type: 'attraction', area: 'dolomites', notes: 'סתם תצפית עם רכבל', maps: 'https://www.google.com/maps/place/Seceda/data=!4m2!3m1!1s0x477813f017517793:0x477f12a987d1eab6' },
  { id: 'p_lago_di_tret', he: 'אגם טרט', orig: 'Lago di Tret', type: 'attraction', area: 'dolomites', maps: 'https://www.google.com/maps/place/Lago+di+Tret/data=!4m2!3m1!1s0x47829100484b8801:0xde0b02921975adb3' },
  { id: 'p_adrenaline_x_treme_adventure', he: 'Adrenaline X-Treme — אומגה', orig: 'Adrenaline X-Treme Adventures', type: 'attraction', area: 'dolomites', notes: 'zipline', maps: 'https://www.google.com/maps/place/Adrenaline+X-Treme+Adventures/data=!4m2!3m1!1s0x477822fd3a42aadb:0x7d54fbac237d8e02' },
  { id: 'p_parco_fluviale_novella', he: 'Parco Fluviale Novella', orig: 'Parco Fluviale Novella', type: 'attraction', area: 'dolomites', notes: 'כל מיני סוגי אקסטרים', maps: 'https://www.google.com/maps/place/Parco+Fluviale+Novella/data=!4m2!3m1!1s0x478291c850b4f9c1:0x5f2df2e1eb64106d' },
  { id: 'p_cascata_di_tret', he: 'מפל טרט', orig: 'Cascata di Tret', type: 'hike', area: 'dolomites', notes: 'מסלול הליכה קצר ומפל', maps: 'https://www.google.com/maps/place/Cascata+di+Tret/data=!4m2!3m1!1s0x47829026e1afe9bf:0x981a17d4b3771c4d' },
  { id: 'p_rafting_center_val_di_sole', he: 'רפטינג ואל די סולה', orig: 'Rafting Center Val di Sole', type: 'attraction', area: 'dolomites', maps: 'https://www.google.com/maps/place/Rafting+Center+Val+di+Sole/data=!4m2!3m1!1s0x4782f596434a4d1b:0x78db3392d1047bd5' },
  { id: 'p_alpine_coaster_gardone', he: 'Alpine Coaster Gardoné', orig: 'Alpine Coaster Gardoné', type: 'attraction', area: 'dolomites', notes: 'רכבת הרים בהר', maps: 'https://www.google.com/maps/place/Alpine+Coaster+Gardon%C3%A9/data=!4m2!3m1!1s0x477864f6567f2aff:0xeef286e7e2b9b96f' },
  { id: 'p_trattoria_relax', he: 'Trattoria Relax', orig: 'Trattoria Relax', type: 'food', area: 'garda', notes: 'מסעדה מומלצת לא תיירותית', maps: 'https://www.google.com/maps/place/Trattoria+Relax/data=!4m2!3m1!1s0x4781f191274565c5:0x98f3941163dd6b8e' },
  { id: 'p_revolution_desenzano_by_linu', he: 'Revolution Desenzano', orig: 'Revolution Desenzano by Linus', type: 'food', area: 'garda', maps: 'https://www.google.com/maps/place/Revolution+Desenzano+by+Linus/data=!4m2!3m1!1s0x4781945b288d6191:0x2991759b0a1be9c9' },
  { id: 'p_lake_como', he: 'אגם קומו', orig: 'אגם קומו', type: 'attraction', area: 'milan', maps: 'https://www.google.com/maps/place/%D7%90%D7%92%D7%9D+%D7%A7%D7%95%D7%9E%D7%95%E2%80%AD/data=!4m2!3m1!1s0x47843d32820b62f7:0x3e40c4eae898e1e0' },
  { id: 'p_adigeo', he: 'ADIGEO — קניון', orig: 'ADIGEO', type: 'shop', area: 'verona', maps: 'https://www.google.com/maps/place/ADIGEO/data=!4m2!3m1!1s0x477f5f9b3f5320f3:0xfad635b1d4e9e6cf' },
  { id: 'p_venice', he: 'ונציה', orig: 'ונציה', type: 'attraction', area: 'venice', maps: 'https://www.google.com/maps/place/%D7%95%D7%A0%D7%A6%D7%99%D7%94%E2%80%AD/data=!4m2!3m1!1s0x477eb1daf1d63d89:0x7ba3c6f0bd92102f' },
  { id: 'p_limone', he: 'Limone', orig: 'Limone', type: 'attraction', area: 'garda', notes: 'הערה על המקום', maps: 'https://www.google.com/maps/place/Limone/data=!4m2!3m1!1s0x478190017aa75b5b:0x17bb657555fba547' },
  { id: 'p_limone_sul_garda', he: 'לימונה סול גארדה', orig: 'Limone Sul Garda', type: 'attraction', area: 'garda', maps: 'https://www.google.com/maps/place/Limone+Sul+Garda/data=!4m2!3m1!1s0x478219065ceab885:0x2793d79c2f93427d' },
  { id: 'p_il_centro_arese', he: 'Il Centro Arese — קניון', orig: 'Il Centro Arese', type: 'shop', area: 'milan', maps: 'https://www.google.com/maps/place/Il+Centro+Arese/data=!4m2!3m1!1s0x4786952f3223c371:0xe7bc95dbb1383339' },
  { id: 'p_lago_di_tenno', he: 'אגם טנו', orig: 'Lago di Tenno', type: 'attraction', area: 'garda', maps: 'https://www.google.com/maps/place/Lago+di+Tenno/data=!4m2!3m1!1s0x478215cf7f77f279:0xeac10a122940f6ba' },
  { id: 'p_riva_del_garda', he: 'ריבה דל גארדה', orig: 'Riva del Garda', type: 'attraction', area: 'garda', maps: 'https://www.google.com/maps/place/Riva+del+Garda/data=!4m2!3m1!1s0x478216d064ddabad:0x6b1bdbb2c3674ca3' },
  { id: 'p_varone_waterfall_cave_park', he: 'מפלי ורונה (Varone)', orig: 'Varone Waterfall Cave Park', type: 'hike', area: 'garda', maps: 'https://www.google.com/maps/place/Varone+Waterfall+Cave+Park/data=!4m2!3m1!1s0x4782169127066b9d:0x21e662a8956e308c' },
  { id: 'p_artnatur_dolomites', he: 'Artnatur Dolomites', orig: 'Artnatur Dolomites', type: 'hotel', area: 'dolomites', maps: 'https://www.google.com/maps/place/Artnatur+Dolomites/data=!4m2!3m1!1s0x47780cc324b1387d:0x19b602b30d07c61a' },
  { id: 'p_lazise', he: 'לאזיזה', orig: 'Lazise', type: 'attraction', area: 'garda', maps: 'https://www.google.com/maps/place/Lazise/data=!4m2!3m1!1s0x4781eef32166794d:0x9bec84e886ff2007' },
  { id: 'p_villa_dei_cedri_spa', he: 'Villa dei Cedri — אגמים תרמיים', orig: 'Villa dei Cedri Spa', type: 'attraction', area: 'verona', maps: 'https://www.google.com/maps/place/Villa+dei+Cedri+Spa/data=!4m2!3m1!1s0x4781e8d54517e297:0x7cbbcb301876d7a0' },
  { id: 'p_parco_natura_viva', he: 'Parco Natura Viva — ספארי', orig: 'Parco Natura Viva', type: 'attraction', area: 'verona', maps: 'https://www.google.com/maps/place/Parco+Natura+Viva/data=!4m2!3m1!1s0x4781ef5758a10a25:0xacdf842c39daaffc' },
  { id: 'p_aquardens', he: 'Aquardens — פארק תרמי', orig: 'Aquardens', type: 'attraction', area: 'verona', maps: 'https://www.google.com/maps/place/Aquardens/data=!4m2!3m1!1s0x4781e57596245e95:0x46949b916aaee01f' },
  { id: 'p_ipertosano_castiglione', he: 'IperTosano — סופר', orig: 'IperTosano Castiglione', type: 'shop', area: 'garda', maps: 'https://www.google.com/maps/place/IperTosano+Castiglione/data=!4m2!3m1!1s0x4781bdda03e0331b:0xc4d4be6a8347c6ed' },
  { id: 'p_aldi_peschiera_del_garda', he: 'ALDI Peschiera', orig: 'ALDI Peschiera del Garda', type: 'shop', area: 'verona', notes: 'סופר ליד המלון', maps: 'https://www.google.com/maps/place/ALDI+Peschiera+del+Garda/data=!4m2!3m1!1s0x4781ea2f1feec437:0x4a2cf751de6f4130' },
  { id: 'p_belvedere_village', he: 'Belvedere Village — המלון שלנו', orig: 'Belvedere Village', type: 'hotel', area: 'verona', maps: 'https://maps.app.goo.gl/AfBFcZh46H7zMf9q9' },
  { id: 'p_holiday_inn_express_mxp', he: 'Holiday Inn Express — מלפנסה', orig: 'Holiday Inn Express Milan Malpensa Airport', type: 'hotel', area: 'milan', notes: 'Via Francesco De Pinedo angolo Via Giovanni Oldrini, 21019 Case Nuove' },
  { id: 'p_autogrill_brembo_sud', he: 'Autogrill Brembo Sud', orig: 'Autogrill Brembo Sud', type: 'drive', area: 'milan', maps: 'https://www.google.com/maps/place/Autogrill+Brembo+Sud/data=!4m2!3m1!1s0x47814d6808ee0281:0xdc20d87f40d68156' },
  { id: 'p_locanda_delle_grazie', he: 'Locanda delle Grazie', orig: 'Locanda delle Grazie', type: 'food', area: 'garda', maps: 'https://www.google.com/maps/place/Locanda+delle+Grazie/data=!4m2!3m1!1s0x4781d2149a0902fb:0xc6168932f8831845' },
  { id: 'p_speck_stube_l_originale_malc', he: 'Speck Stube — מלצ׳זינה', orig: 'Speck Stube l’originale - Malcesine', type: 'food', area: 'garda', notes: 'בשרים', maps: 'https://www.google.com/maps/place/Speck+Stube+l%E2%80%99originale+-+Malcesine/data=!4m2!3m1!1s0x47821be2fe038c39:0x3bccf19f8978e7d0' },
  { id: 'p_agraria_riva_del_garda', he: 'Agraria Riva del Garda', orig: 'Agraria Riva del Garda', type: 'food', area: 'garda', notes: 'שמן זית', maps: 'https://www.google.com/maps/place/Agraria+Riva+del+Garda/data=!4m2!3m1!1s0x478216c9483bc5df:0xa17a0c72e116b924' },
  { id: 'p_tito_speck_il_maso_dello_spe', he: 'Tito Speck', orig: 'Tito Speck - Il Maso dello Speck', type: 'food', area: 'dolomites', maps: 'https://www.google.com/maps/place/Tito+Speck+-+Il+Maso+dello+Speck/data=!4m2!3m1!1s0x47787c394ce13b51:0xc7d5fc4f1feed110' },
  { id: 'p_gioielleria_polver', he: 'Gioielleria Polver', orig: 'Gioielleria Polver', type: 'shop', area: 'garda', maps: 'https://www.google.com/maps/place/Gioielleria+Polver/data=!4m2!3m1!1s0x47819443a1da675f:0x73126a540a0e45f' },
  { id: 'p_gelateria_miracolo', he: 'Gelateria Miracolo', orig: 'Gelateria Miracolo', type: 'food', area: 'garda', maps: 'https://www.google.com/maps/place/Gelateria+Miracolo/data=!4m2!3m1!1s0x9d6d7aaf3c008b:0x24a2a8612310e69' },
  { id: 'p_spa_thermal_garden', he: 'SPA & Thermal Garden', orig: 'SPA & Thermal Garden', type: 'attraction', area: 'garda', maps: 'https://www.google.com/maps/place/SPA+%26+Thermal+Garden/data=!4m2!3m1!1s0x47819351f24d429d:0xbefb341b84952f85' },
  { id: 'p_fenix_scenario', he: 'FENIX Scenario', orig: 'FENIX Scenario', type: 'shop', area: 'milan', maps: 'https://www.google.com/maps/place/FENIX+Scenario/data=!4m2!3m1!1s0x4786c18d08d4abc3:0x9d7e5efeb14a4db2' },
  { id: 'p_cisalfa_sport_milan', he: 'Cisalfa Sport', orig: 'Cisalfa Sport Milan', type: 'shop', area: 'milan', maps: 'https://www.google.com/maps/place/Cisalfa+Sport+Milan/data=!4m2!3m1!1s0x4786c6afa1b934f5:0x3d3a2b4d849aba90' },
  { id: 'p_foot_locker', he: 'Foot Locker', orig: 'Foot Locker', type: 'shop', area: 'milan', maps: 'https://www.google.com/maps/place/Foot+Locker/data=!4m2!3m1!1s0x4786c6a5673c7bad:0x94c4ecd318603f6f' },
  { id: 'p_peck', he: 'Peck', orig: 'Peck', type: 'food', area: 'milan', maps: 'https://www.google.com/maps/place/Peck/data=!4m2!3m1!1s0x4786c6ac700a504d:0xe365c0d592e6ce32' },
  { id: 'p_cos', he: 'COS', orig: 'COS', type: 'shop', area: 'milan', maps: 'https://www.google.com/maps/place/COS/data=!4m2!3m1!1s0x4786c6b314427117:0x73bd6c007ab746a3' },
  { id: 'p_dry', he: 'Dry — פיצה וקוקטיילים', orig: 'Dry', type: 'food', area: 'milan', maps: 'https://www.google.com/maps/place/Dry/data=!4m2!3m1!1s0x4786c1352cd7c1a1:0xff78ef9de872a1ac' },
  { id: 'p_pastamadre', he: 'Pastamadre', orig: 'Pastamadre', type: 'food', area: 'milan', maps: 'https://www.google.com/maps/place/Pastamadre/data=!4m2!3m1!1s0x4786c4222f1933f3:0xa41b54f0ccffe402' },
  { id: 'p_end_milano', he: 'END. Milano', orig: 'END. Milano', type: 'shop', area: 'milan', maps: 'https://www.google.com/maps/place/END.+Milano/data=!4m2!3m1!1s0x4786c7a26832bbd3:0xc4062250448405d7' },
  { id: 'p_sirmione_largo_faselo_centro', he: 'סירמיונה', orig: 'Sirmione - Largo Faselo, Centro', type: 'attraction', area: 'garda', maps: 'https://www.google.com/maps/place/Sirmione+-+Largo+Faselo,+Centro/data=!4m2!3m1!1s0x478193547d45f601:0xa06e85c6954fb4a2' },
  { id: 'p_uniqlo_piazza_cordusio', he: 'UNIQLO', orig: 'UNIQLO Piazza Cordusio', type: 'shop', area: 'milan', maps: 'https://www.google.com/maps/place/UNIQLO+Piazza+Cordusio/data=!4m2!3m1!1s0x4786c747b94931bb:0x24033b0d2aae3d23' },
  { id: 'p_onitsuka_tiger_milano', he: 'Onitsuka Tiger', orig: 'Onitsuka Tiger Milano', type: 'shop', area: 'milan', maps: 'https://www.google.com/maps/place/Onitsuka+Tiger+Milano/data=!4m2!3m1!1s0x4786c14fed4c1e7f:0x75aa6a2d2b95db10' },
];

/** All columns, right-to-left: the unassigned pool first, then the days. */
export const COLUMNS: readonly ColumnDef[] = [
  { id: POOL, title: 'טרם שובצו' },
  ...DAYS.map((d): ColumnDef => ({ id: d.id, title: d.label, dow: d.dow, note: d.note, date: d.date })),
];

export const COLUMN_IDS: readonly ColumnId[] = COLUMNS.map((c) => c.id);
