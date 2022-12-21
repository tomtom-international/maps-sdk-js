## GO SDK theme
A customised version of the theme inside [typedoc-plugin-markdown](https://github.com/tgreyuk/typedoc-plugin-markdown/tree/master/packages/typedoc-plugin-markdown), 
adapted to the needs of GO-SDK-JS documentation and TomTom devportal.

### How does the plugin work?
The [typedoc-plugin-markdown](https://github.com/tgreyuk/typedoc-plugin-markdown/tree/master/packages/typedoc-plugin-markdown) plugin uses templates to
render the typedoc output to .md files. The plugin uses [Handlebars](https://handlebarsjs.com) as its templating system.
The base Handlebars templating files are defined in the [`resources`](https://github.com/tgreyuk/typedoc-plugin-markdown/tree/master/packages/typedoc-plugin-markdown/src/resources) folder in typedoc-plugin-markdown.
These files are registered to Handlebars in the constructor of the [`MarkdownTheme`](https://github.com/tgreyuk/typedoc-plugin-markdown/blob/5c159a2c816dfbc9a05656ca0f57566d97f262e5/packages/typedoc-plugin-markdown/src/theme.ts#L80)
class defined in the plugin.

There are three types of template files in the `resources` directory:
- Partials: reusable templates that can be accessed inside other template files
- Helpers: helper function that are used to implement functionality that isn't part of Handlebars language
- Templates: these are the highest level template files that get called at the top level of rendering

### How do we extend the plugin?
We have created a GOSDKTheme class which extends from the [`MarkdownTheme`](https://github.com/tgreyuk/typedoc-plugin-markdown/blob/5c159a2c816dfbc9a05656ca0f57566d97f262e5/packages/typedoc-plugin-markdown/src/theme.ts#L26).
To edit the output, the previously mentioned template files are overwritten with the templates we define. As of v3 of the plugin, there is
no better way to accomplish this. Our `registerPartial` function is called after `MarkdownTheme` has registered the original partials, effectively
overwriting the partials with the ones we have defined (only the partials we have defined).

### How should you extend it even further?
#### Overwriting partials
Simply add the partial you want to overwrite to the `./src/resources/partials` directory. Make sure the filename is identical to the partial
you're overwriting.

#### Overwriting helper functions
Use the `Handlebars.registerHelper`. Possibly have to unregister the original helper with `Handlebars.unregisterHelper`.

#### Overwriting templates
Here's an example for overwriting the `reflection.hbs` template.

Compile the template by passing the correct path:
```typescript
const TEMPLATE_PATH = path.join(__dirname, 'resources', 'templates');

export const reflectionTemplate = Handlebars.compile(
	fs.readFileSync(path.join(TEMPLATE_PATH, 'reflection.hbs')).toString()
);
```

Overwrite it by overriding the corresponding function in `GOSDKTheme` (in this case `getReflectionTemplate` since
we are overwriting the reflection template).

```typescript
  // inside GOSDKTheme class
  ...
  getReflectionTemplate() {
    return (pageEvent: PageEvent<ContainerReflection>) => {
        return reflectionTemplate(pageEvent, {
            allowProtoMethodsByDefault: true,
            allowProtoPropertiesByDefault: true,
            data: {theme: this},
        });
    };
}
```

