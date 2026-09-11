import type { Place } from '../trip.ts';

// Existing IDs are retained so saved itineraries and edits remain valid.
export const OTHER: readonly Place[] = [
  { id: 'p_adigeo', he: 'ADIGEO — קניון', orig: 'ADIGEO', type: 'shop', area: 'verona', maps: 'https://www.google.com/maps/place/ADIGEO/data=!4m2!3m1!1s0x477f5f9b3f5320f3:0xfad635b1d4e9e6cf' },
  { id: 'p_il_centro_arese', he: 'Il Centro Arese — קניון', orig: 'Il Centro Arese', type: 'shop', area: 'milan', maps: 'https://www.google.com/maps/place/Il+Centro+Arese/data=!4m2!3m1!1s0x4786952f3223c371:0xe7bc95dbb1383339' },
  { id: 'p_artnatur_dolomites', he: 'Artnatur Dolomites', orig: 'Artnatur Dolomites', type: 'hotel', area: 'dolomites', maps: 'https://www.google.com/maps/place/Artnatur+Dolomites/data=!4m2!3m1!1s0x47780cc324b1387d:0x19b602b30d07c61a' },
  { id: 'p_ipertosano_castiglione', he: 'IperTosano — סופר', orig: 'IperTosano Castiglione', type: 'shop', area: 'garda', maps: 'https://www.google.com/maps/place/IperTosano+Castiglione/data=!4m2!3m1!1s0x4781bdda03e0331b:0xc4d4be6a8347c6ed' },
  { id: 'p_aldi_peschiera_del_garda', he: 'ALDI Peschiera', orig: 'ALDI Peschiera del Garda', type: 'shop', area: 'verona', notes: 'סופר ליד המלון', maps: 'https://www.google.com/maps/place/ALDI+Peschiera+del+Garda/data=!4m2!3m1!1s0x4781ea2f1feec437:0x4a2cf751de6f4130' },
  { id: 'p_belvedere_village', he: 'Belvedere Village — המלון שלנו', orig: 'Belvedere Village', type: 'hotel', area: 'verona', maps: 'https://maps.app.goo.gl/AfBFcZh46H7zMf9q9' },
  { id: 'p_holiday_inn_express_mxp', he: 'Holiday Inn Express — מלפנסה', orig: 'Holiday Inn Express Milan Malpensa Airport', type: 'hotel', area: 'milan', notes: 'Via Francesco De Pinedo angolo Via Giovanni Oldrini, 21019 Case Nuove' },
  { id: 'p_autogrill_brembo_sud', he: 'Autogrill Brembo Sud', orig: 'Autogrill Brembo Sud', type: 'drive', area: 'milan', maps: 'https://www.google.com/maps/place/Autogrill+Brembo+Sud/data=!4m2!3m1!1s0x47814d6808ee0281:0xdc20d87f40d68156' },
  { id: 'p_gioielleria_polver', he: 'Gioielleria Polver', orig: 'Gioielleria Polver', type: 'shop', area: 'garda', maps: 'https://www.google.com/maps/place/Gioielleria+Polver/data=!4m2!3m1!1s0x47819443a1da675f:0x73126a540a0e45f' },
  { id: 'p_fenix_scenario', he: 'FENIX Scenario', orig: 'FENIX Scenario', type: 'shop', area: 'milan', maps: 'https://www.google.com/maps/place/FENIX+Scenario/data=!4m2!3m1!1s0x4786c18d08d4abc3:0x9d7e5efeb14a4db2' },
  { id: 'p_cisalfa_sport_milan', he: 'Cisalfa Sport', orig: 'Cisalfa Sport Milan', type: 'shop', area: 'milan', maps: 'https://www.google.com/maps/place/Cisalfa+Sport+Milan/data=!4m2!3m1!1s0x4786c6afa1b934f5:0x3d3a2b4d849aba90' },
  { id: 'p_foot_locker', he: 'Foot Locker', orig: 'Foot Locker', type: 'shop', area: 'milan', maps: 'https://www.google.com/maps/place/Foot+Locker/data=!4m2!3m1!1s0x4786c6a5673c7bad:0x94c4ecd318603f6f' },
  { id: 'p_cos', he: 'COS', orig: 'COS', type: 'shop', area: 'milan', maps: 'https://www.google.com/maps/place/COS/data=!4m2!3m1!1s0x4786c6b314427117:0x73bd6c007ab746a3' },
  { id: 'p_end_milano', he: 'END. Milano', orig: 'END. Milano', type: 'shop', area: 'milan', maps: 'https://www.google.com/maps/place/END.+Milano/data=!4m2!3m1!1s0x4786c7a26832bbd3:0xc4062250448405d7' },
  { id: 'p_uniqlo_piazza_cordusio', he: 'UNIQLO', orig: 'UNIQLO Piazza Cordusio', type: 'shop', area: 'milan', maps: 'https://www.google.com/maps/place/UNIQLO+Piazza+Cordusio/data=!4m2!3m1!1s0x4786c747b94931bb:0x24033b0d2aae3d23' },
  { id: 'p_onitsuka_tiger_milano', he: 'Onitsuka Tiger', orig: 'Onitsuka Tiger Milano', type: 'shop', area: 'milan', maps: 'https://www.google.com/maps/place/Onitsuka+Tiger+Milano/data=!4m2!3m1!1s0x4786c14fed4c1e7f:0x75aa6a2d2b95db10' },
];
