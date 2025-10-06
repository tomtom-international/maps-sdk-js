# 📚 Maps SDK JS documentation

## 📝 Writing Customer-Facing Documentation

Maps SDK JS documentation consists of two main types:
- **Guides** (static, manually written)
- **API Reference** (dynamically generated)

Guides are written by the team and should be clear, direct, and helpful for customers. Use Markdown (or MDX) with frontmatter for metadata (e.g., title, tags, visibility). Structure guides with:
- A concise introduction
- Key features or concepts
- Step-by-step instructions or examples
- Visual aids (images, code snippets)
- External links to resources (e.g., developer portal, API docs)

### 📁 Documentation Structure

- **Public guides**: Located in [`../docs-portal/guides/`](../docs-portal/guides/) and [`../docs-portal/introduction/`](../docs-portal/introduction/)
- **API reference**: Generated automatically in [`../docs-portal/api-reference/`](../docs-portal/api-reference/)
- **Examples**: In [`../docs-portal/examples/`](../docs-portal/examples/)

### 🎨 Style and Best Practices

- Use clear, customer-friendly language
- Highlight important features and capabilities
- Provide actionable steps and examples
- Use frontmatter for metadata (see examples in [`../docs-portal/introduction/overview.mdx`](../docs-portal/introduction/overview.mdx))
- Keep documentation up-to-date with SDK changes
- Link to external resources for further help

### 🚀 Generating and Publishing Documentation

- API reference is generated using TypeDoc and custom themes
- Guides and reference docs are written in Markdown/MDX and delivered to the developer portal
- Test generated documentation using the [drumkit monorepo project](https://github.com/tomtom-international/drumkit-monorepo)
- Commit updates to [docs-portal documentation](https://github.com/tomtom-international/devportal-documentation)

### 📖 Reference Guides
- [Technical guidelines](https://confluence.tomtomgroup.com/display/DR/Technical+Documentation+Guidelines)
- [Publication process](https://confluence.tomtomgroup.com/display/DR/Publication+process)
- [Documentation guide](https://confluence.tomtomgroup.com/display/DR/Documentation+guide)

## 🔄 Maintaining Documentation

Guides must be updated as SDK functionality evolves. This includes:
- Adding new features
- Updating instructions and examples
- Fixing or updating links
- Ensuring consistency with the latest SDK version

## 📝 Example Frontmatter

```mdx
---
title: Project setup
hideMenu: false
hideSubmenu: false
hasTwoColumns: false
titleTags:
- label: "VERSION 0.15.1"
  color: "grey5"
- label: "PRIVATE PREVIEW"
  color: "grey5"
---
```

For more examples, see the files in [`../docs-portal/introduction/`](../docs-portal/introduction/) and [`../docs-portal/guides/`](../docs-portal/guides/).

## 🌐 Published Documentation and Examples

See the live documentation and examples at '{DOCS_PORTAL_ENV}/maps-sdk-js/...'
