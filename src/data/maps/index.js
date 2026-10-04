/**
 * maps/index.js
 * ----------------------------------------------------------------------------
 * The map registry. Every map in the game is listed here once, and the rest of
 * the game only ever refers to maps by their string id.
 *
 * TO ADD A NEW MAP:
 *   1. Create `src/data/maps/yourMap.js` exporting a map definition.
 *   2. Import it below and add it to MAPS.
 * That is the whole process — nothing else needs to change. The test suite then
 * automatically checks your map for ragged rows, unknown tile characters, spawn
 * points inside walls, and exits that lead nowhere.
 */

import { emberhollow } from './emberhollow.js';
import { playerHouse } from './playerHouse.js';
import { wardensLodge } from './wardensLodge.js';
import { mendersHall } from './mendersHall.js';
import { supplyPost } from './supplyPost.js';
import { route1 } from './route1.js';
import { thistlewood } from './thistlewood.js';
import { thistlewoodMendersHall } from './thistlewoodMendersHall.js';
import { thistlewoodSupplyPost } from './thistlewoodSupplyPost.js';
import { thistlewoodCottage } from './thistlewoodCottage.js';
import { route2 } from './route2.js';
import { verdantHall } from './verdantHall.js';
import { mistvaultMouth } from './mistvaultMouth.js';
import { mistvaultGalleries } from './mistvaultGalleries.js';
import { mistvaultCore } from './mistvaultCore.js';
import { tidewatch } from './tidewatch.js';
import { tidewatchMendersHall } from './tidewatchMendersHall.js';
import { tidewatchSupplyPost } from './tidewatchSupplyPost.js';
import { tidalHall } from './tidalHall.js';
import { stormriseLower } from './stormriseLower.js';
import { stormriseHigh } from './stormriseHigh.js';
import { stormriseSummit } from './stormriseSummit.js';
import { voltspire } from './voltspire.js';
import { voltspireMendersHall } from './voltspireMendersHall.js';
import { voltspireSupplyPost } from './voltspireSupplyPost.js';
import { stormHall } from './stormHall.js';
import { aerieRoad } from './aerieRoad.js';
import { aerie } from './aerie.js';
import { aerieLodge } from './aerieLodge.js';
import { hollowWorks } from './hollowWorks.js';
import { convergenceCore } from './convergenceCore.js';
import { circleHall } from './circleHall.js';

export const MAPS = {
  emberhollow,
  playerHouse,
  wardensLodge,
  mendersHall,
  supplyPost,
  route1,
  thistlewood,
  thistlewoodMendersHall,
  thistlewoodSupplyPost,
  thistlewoodCottage,
  route2,
  verdantHall,
  mistvaultMouth,
  mistvaultGalleries,
  mistvaultCore,
  tidewatch,
  tidewatchMendersHall,
  tidewatchSupplyPost,
  tidalHall,
  stormriseLower,
  stormriseHigh,
  stormriseSummit,
  voltspire,
  voltspireMendersHall,
  voltspireSupplyPost,
  stormHall,
  aerieRoad,
  aerie,
  aerieLodge,
  hollowWorks,
  convergenceCore,
  circleHall,
};

/**
 * Fetch a map definition by id. Throws a clear error for an unknown id rather
 * than returning undefined and crashing somewhere less obvious later.
 */
export function getMapDefinition(id) {
  const map = Object.hasOwn(MAPS, id) ? MAPS[id] : undefined;
  if (!map) {
    throw new Error(
      `[maps] Unknown map id "${id}". Known maps: ${Object.keys(MAPS).join(', ')}. ` +
        `Register new maps in src/data/maps/index.js.`
    );
  }
  return map;
}

/** The map a brand new game starts on. */
export const STARTING_MAP_ID = 'emberhollow';
