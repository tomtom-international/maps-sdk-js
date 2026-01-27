/**
 * Type of docs portal environment to restrict an example to.
 * * You can define the environment in the example's content/page.mdx front-matter using the `env-up-to` property.
 *
 * * 'none' - The example is disabled in all docs portal environments including localhost.
 * * 'localhost' - The example is only available in localhost.
 * * 'pr-preview' - The example is only available in localhost and PR preview environments.
 * * 'non-prod' - The example is available in all non-prod environments (localhost, pr-preview, staging).
 * * default (undefined): all environments enabled
 */
export type DocsPortalExampleEnv = 'none' | 'localhost' | 'pr-preview' | 'non-prod';
