# Security policy

This policy covers the TomTom Maps SDK for JavaScript, `@tomtom-org/maps-sdk`, and its plugins,
`@tomtom-org/maps-sdk-plugin-*`.

## Reporting a vulnerability

Don't report a vulnerability in a public issue or discussion. Report it privately instead:

- **On GitHub**: open the [Security tab](https://github.com/tomtom-international/maps-sdk-js/security) of this
  repository and choose **Report a vulnerability**.
- **By email**: write to [PRODSEC: security contact address].

Include what you can:

- the package and its version, and the browser or Node.js version;
- what an attacker can do, and what they need first, such as a page they control or a key they hold;
- the steps or code that show it.

If the vulnerability is in a TomTom API rather than in the SDK, report it the same way, and we'll pass it on.

## What happens next

| Step | Target |
| --- | --- |
| We confirm we received your report | [PRODSEC: hours] |
| We tell you whether we accept it, and its severity | [PRODSEC: days] |
| We release a fix for a critical vulnerability | [PRODSEC: days] |
| We release a fix for a high vulnerability | [PRODSEC: days] |
| We release a fix for a medium or low vulnerability | [PRODSEC: days, or the next release] |

When the fix is out, we:

- publish a GitHub security advisory on this repository, crediting you unless you'd rather we didn't;
- mark the affected versions as deprecated on npm, naming the version to upgrade to.

Please keep the vulnerability private until the advisory is out.

## Supported versions

We fix vulnerabilities in the latest release of the SDK and of each plugin. Upgrade to it to get a fix.
