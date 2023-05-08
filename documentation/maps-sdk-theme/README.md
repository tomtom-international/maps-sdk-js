## Maps SDK theme
A customised version of the theme inside [typedoc-plugin-markdown](https://github.com/tgreyuk/typedoc-plugin-markdown/tree/master/packages/typedoc-plugin-markdown), 
adapted to the needs of Maps SDK JS documentation and TomTom devportal.

### How does the plugin work?
The [typedoc-plugin-markdown](https://github.com/tgreyuk/typedoc-plugin-markdown/tree/master/packages/typedoc-plugin-markdown) plugin hooks into the Typedoc
documentation generation process, takes the Typedoc converter output and renders markdown files (instead of the default HTML output from typedoc). It renders 
the documentation using smaller "building blocks" of components. The two main components are templates and partials:  

- Templates: these are the highest level "building blocks" that get called at the top level of rendering (e.g. when creating a new page)
- Partials: reusable functions that render a specific part of a page, given an input. For example: the `unionType` partial 
  (in the `type.union.ts` file) is responsible for rendering union types. The output of the function is a string of 
  markdown content.

Also have a look at the `README` and `docs` folder in the plugin repo for some information on the available options.

### How do we extend the plugin?
We have created a `MapsSDKTheme` class (and related classes) which extends from the [`MarkdownTheme`](https://github.com/tgreyuk/typedoc-plugin-markdown/blob/5c159a2c816dfbc9a05656ca0f57566d97f262e5/packages/typedoc-plugin-markdown/src/theme.ts#L26).
By overwriting the `MarkdownTheme` class, the previously mentioned partial and template functions can be overwritten with our own custom implementations.

### How should you extend it even further?
Take a look at the `src/resources.ts` file. Custom partials are created and exported in that file. In a very similar way,
templates can be overwritten.

