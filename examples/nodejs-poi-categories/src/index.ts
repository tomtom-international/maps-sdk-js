import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { getPOICategories, getPOICategoryCodes } from '@tomtom-org/maps-sdk/services';
import { API_KEY } from './config';

TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    // 1. Fetch all available categories
    const { poiCategories: all } = await getPOICategories();
    console.log(`Total categories: ${all.length}`);

    // 2. Filter by keyword — served from the same cache, no extra API call
    const { poiCategories: gyms } = await getPOICategories({ language: 'es-ES', filters: ['gimnasio'] });
    console.log('\nLocalized categories:');
    gyms.forEach((category) => console.log(`  ${category.name} (${category.code})`));

    // 3. Get just the codes — useful for passing directly to search() or POIsModule.configure()
    const multiCategoryCodes = await getPOICategoryCodes({ filters: ['metro', 'parking'] });
    console.log(`\nMulti category codes: ${multiCategoryCodes.join(', ')}`);
})();
