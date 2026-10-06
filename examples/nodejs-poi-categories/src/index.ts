import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import {
    discoverPlaces,
    getPOICategories,
    type POICategoryResult,
    resolvePOICategories,
} from '@tomtom-org/maps-sdk/services';
import { API_KEY } from './config';

TomTomConfig.instance.put({ apiKey: API_KEY });

const listCategories = (categories: POICategoryResult[]) =>
    categories.map((category) => `${category.name} (${category.code})`).join(', ') || 'no match';

(async () => {
    // 1. Fetch all available categories
    const { poiCategories: all } = await getPOICategories();
    console.log(`Total categories: ${all.length}`);

    // 2. Find categories by keyword, best match first, served from the same cache with no extra API call.
    // 'bar' keeps Bar and leaves out Nail Salon ("Nail Bar"); 'cafe' finds Café without the accent.
    console.log('\nBest matches per keyword:');
    for (const keyword of ['bar', 'cafe', 'parking']) {
        const { poiCategories: matches } = await getPOICategories({ filters: [keyword] });
        console.log(`  ${keyword}: ${listCategories(matches)}`);
    }

    // 3. Keywords match the names and synonyms of the requested language
    const { poiCategories: gyms } = await getPOICategories({ language: 'es-ES', filters: ['gimnasio'] });
    console.log(`\nLocalized: ${listCategories(gyms)}`);

    // 4. Resolve several keywords for one search, and hear which matched nothing
    const { poiCategories, unmatched } = await resolvePOICategories({ filters: ['metro', 'parking', 'vinyl'] });
    console.log(`\nCodes for metro and parking: ${poiCategories.join(', ')} (no match: ${unmatched.join(', ')})`);

    const { features: places } = await discoverPlaces({
        filters: { poiCategories },
        geoBias: { position: [4.9041, 52.3676] }, // Amsterdam
        limit: 5,
    });
    console.log('\nNearest in Amsterdam:');
    places.forEach((place) =>
        console.log(`  ${place.properties.poi?.name}, ${place.properties.address.freeformAddress}`),
    );

    // 5. Or name the categories in words and let the search resolve them, in one call
    const { features: food } = await discoverPlaces({
        filters: { poiCategoryQuery: ['sushi', 'pizza'] },
        geoBias: { position: [4.9041, 52.3676] },
        limit: 3,
    });
    console.log('\nSushi or pizza in Amsterdam, from the words alone:');
    food.forEach((place) => console.log(`  ${place.properties.poi?.name}`));
})();
