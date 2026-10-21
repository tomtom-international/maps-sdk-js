import type { Language } from '@tomtom-org/maps-sdk/core';
import { TomTomConfig } from '@tomtom-org/maps-sdk/core';
import { TomTomMap } from '@tomtom-org/maps-sdk/map';
import './style.css';
import { API_KEY } from './config';
import { initTogglePanel } from './togglePanel';

const mapLanguages: { text: string; value: Language }[] = [
    { text: 'Neutral Ground Truth (Default)', value: 'ngt' },
    { text: 'English (Great Britain)', value: 'en-GB' },
    { text: 'Arabic', value: 'ar' },
    { text: 'German', value: 'de-DE' },
    { text: 'Dutch', value: 'nl-NL' },
    { text: 'French', value: 'fr-FR' },
    { text: 'Spanish (Castilian)', value: 'es-ES' },
    { text: 'Italian', value: 'it-IT' },
    { text: 'Chinese (Simplified)', value: 'zh-Hans' },
    { text: 'Chinese (Traditional)', value: 'zh-Hant' },
    { text: 'Hebrew', value: 'he-IL' },
    { text: 'Hindi', value: 'hi-IN' },
    { text: 'Japanese', value: 'ja-JP' },
    { text: 'Serbian', value: 'sr-RS' },
    { text: 'Ukrainian', value: 'uk-UA' },
];
const configLanguage: Language = 'nl-NL';

// (Set your own API key when working in your own environment)
TomTomConfig.instance.put({ apiKey: API_KEY });

(async () => {
    const map = new TomTomMap({
        mapLibre: {
            container: 'sdk-map',
            zoom: 3,
            minZoom: 2,
            center: [18.33157, 39.78563],
        },
        language: configLanguage,
    });

    const languageSelector = document.querySelector('#ui-mapLanguages') as HTMLSelectElement;
    for (const language of mapLanguages) {
        languageSelector.add(new Option(language.text, language.value, undefined, configLanguage === language.value));
    }
    languageSelector.addEventListener('change', (event) =>
        map.setLanguage((event.target as HTMLOptionElement).value as Language),
    );

    initTogglePanel();
})();
