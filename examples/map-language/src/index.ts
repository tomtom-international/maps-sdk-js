import type { Language } from '@tomtom-org/maps-sdk/core';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import './style.css';

const mapLanguages: { text: string; value: Language }[] = [
    { text: 'Neutral Ground Truth (Default)', value: 'ngt' },
    { text: 'English (Great Britain)', value: 'en-GB' },
    { text: 'Arabic', value: 'ar' },
    { text: 'German', value: 'de-DE' },
    { text: 'Dutch', value: 'nl-NL' },
    { text: 'French', value: 'fr-FR' },
    { text: 'Spanish (Castilian)', value: 'es-ES' },
    { text: 'Italian', value: 'it-IT' },
];
const configLanguage: Language = 'nl-NL';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: process.env.API_KEY_EXAMPLES });

(async () => {
    const map = new TomTomMap(
        { container: 'maps-sdk-js-examples-map-container', zoom: 3, minZoom: 2, center: [18.33157, 39.78563] },
        { language: configLanguage },
    );

    const languageSelector = document.querySelector('#maps-sdk-js-examples-mapLanguages') as HTMLSelectElement;
    for (const language of mapLanguages) {
        languageSelector.add(new Option(language.text, language.value, undefined, configLanguage === language.value));
    }
    languageSelector.addEventListener('change', (event) =>
        map.setLanguage((event.target as HTMLOptionElement).value as Language),
    );
})();
