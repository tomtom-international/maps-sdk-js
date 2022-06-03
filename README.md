# go-sdk-js

GO SDK JS is a JavaScript library for building web applications using TomTom maps and location services. With GO SDK JS you can build powerful web applications that seamlessly integrate TomTom's
mapping and service technologies including map display and interaction, search, routing, and traffic.

## Development of go-sdk-js

### Prepare

* Install NVM
* Install the v16.+.+ version of nodejs/npm

```nvm install 16```
or/and
```nvm use 16```

### Install dependencies

```shell
# all workspaces
npm i -ws
# or
npm ci -ws
# specific workspaces
npm i -w core
npm i -w map
npm i -w services
# or
npm ci -w core
# and so on...
```

### Run build with type definitions generation (like in the CI/CD)

```shell
# all workspaces
npm run build:full -ws
# specific workspaces
npm run build:full -w core
npm run build:full -w map
npm run build:full -w services
```

### Run tests

*Please note*, that some modules depend on others, so those should be built first with type definitions generation.

```shell
# all workspaces
npm test -ws
# specific workspaces
npm test -w core
npm test -w map
npm test -w services
```

### Update all dependencies

```shell
# all workspaces
npm run update-dependencies -ws
# specific workspaces
npm run update-dependencies -w core
npm run update-dependencies -w map
npm run update-dependencies -w services
```

### Cleaning directories

```shell
# distribution
npm run clean:dist -ws
# build cache
npm run clean:cache -ws
```
