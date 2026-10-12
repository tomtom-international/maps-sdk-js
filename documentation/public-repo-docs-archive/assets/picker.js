// Fills the version picker; a module, so it awaits at the top level. A version on the site opens the same page, or
// its index page when it lacks that page; a version off the site opens its tag on GitHub.
const versionPicker = document.querySelector('select.version-picker');
if (versionPicker) {
    const { siteRoot, currentVersion } = versionPicker.dataset;
    const versions = await (await fetch(`${siteRoot}versions.json`)).json();
    for (const [index, { version }] of versions.entries()) {
        const option = new Option(`v${version}${index === 0 ? ' (latest)' : ''}`, version);
        option.selected = version === currentVersion;
        versionPicker.add(option);
    }
    versionPicker.addEventListener('change', async () => {
        const { githubTreeUrl } = versions.find(({ version }) => version === versionPicker.value);
        if (githubTreeUrl) {
            location.href = githubTreeUrl;
            return;
        }
        const versionSegment = `/${currentVersion}/`;
        const segmentStart = location.pathname.indexOf(versionSegment);
        const siteBase = location.pathname.slice(0, segmentStart);
        const pagePath = location.pathname.slice(segmentStart + versionSegment.length);
        const target = `${siteBase}/${versionPicker.value}/${pagePath}`;
        const pageExists = (await fetch(target, { method: 'HEAD' })).ok;
        location.href = pageExists ? target : `${siteBase}/${versionPicker.value}/index.html`;
    });
}
