import type { Place } from '../trip.ts';

// Existing IDs are retained so saved itineraries and edits remain valid.
export const FOOD: readonly Place[] = [
  { id: 'p_trattoria_relax', he: 'Trattoria Relax', orig: 'Trattoria Relax', type: 'food', area: 'garda', notes: 'מסעדה מומלצת לא תיירותית', maps: 'https://www.google.com/maps/place/Trattoria+Relax/data=!4m2!3m1!1s0x4781f191274565c5:0x98f3941163dd6b8e' },
  { id: 'p_revolution_desenzano_by_linu', he: 'Revolution Desenzano', orig: 'Revolution Desenzano by Linus', type: 'food', area: 'garda', maps: 'https://www.google.com/maps/place/Revolution+Desenzano+by+Linus/data=!4m2!3m1!1s0x4781945b288d6191:0x2991759b0a1be9c9' },
  { id: 'p_locanda_delle_grazie', he: 'Locanda delle Grazie', orig: 'Locanda delle Grazie', type: 'food', area: 'garda', maps: 'https://www.google.com/maps/place/Locanda+delle+Grazie/data=!4m2!3m1!1s0x4781d2149a0902fb:0xc6168932f8831845' },
  { id: 'p_speck_stube_l_originale_malc', he: 'Speck Stube — מלצ׳זינה', orig: 'Speck Stube l’originale - Malcesine', type: 'food', area: 'garda', notes: 'בשרים', maps: 'https://www.google.com/maps/place/Speck+Stube+l%E2%80%99originale+-+Malcesine/data=!4m2!3m1!1s0x47821be2fe038c39:0x3bccf19f8978e7d0' },
  { id: 'p_agraria_riva_del_garda', he: 'Agraria Riva del Garda', orig: 'Agraria Riva del Garda', type: 'food', area: 'garda', notes: 'שמן זית', maps: 'https://www.google.com/maps/place/Agraria+Riva+del+Garda/data=!4m2!3m1!1s0x478216c9483bc5df:0xa17a0c72e116b924' },
  { id: 'p_tito_speck_il_maso_dello_spe', he: 'Tito Speck', orig: 'Tito Speck - Il Maso dello Speck', type: 'food', area: 'dolomites', maps: 'https://www.google.com/maps/place/Tito+Speck+-+Il+Maso+dello+Speck/data=!4m2!3m1!1s0x47787c394ce13b51:0xc7d5fc4f1feed110' },
  { id: 'p_gelateria_miracolo', he: 'Gelateria Miracolo', orig: 'Gelateria Miracolo', type: 'food', area: 'garda', maps: 'https://www.google.com/maps/place/Gelateria+Miracolo/data=!4m2!3m1!1s0x9d6d7aaf3c008b:0x24a2a8612310e69' },
  { id: 'p_peck', he: 'Peck', orig: 'Peck', type: 'food', area: 'milan', maps: 'https://www.google.com/maps/place/Peck/data=!4m2!3m1!1s0x4786c6ac700a504d:0xe365c0d592e6ce32' },
  { id: 'p_dry', he: 'Dry — פיצה וקוקטיילים', orig: 'Dry', type: 'food', area: 'milan', maps: 'https://www.google.com/maps/place/Dry/data=!4m2!3m1!1s0x4786c1352cd7c1a1:0xff78ef9de872a1ac' },
  { id: 'p_pastamadre', he: 'Pastamadre', orig: 'Pastamadre', type: 'food', area: 'milan', maps: 'https://www.google.com/maps/place/Pastamadre/data=!4m2!3m1!1s0x4786c4222f1933f3:0xa41b54f0ccffe402' },
];
