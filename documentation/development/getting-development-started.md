---
title: Getting development started
---

<a style="display: block; margin: 0; padding: 0;" name="_getting_development_started"></a>

## Requirements

Install next tools:

* Git latest
* NVM latest
* NodeJS 16.+ (LTS) - via NVM
* NPM 8.+ (correspondent to the LTS) - via NVM

## Setup NodeJS/NPM

```shell
nvm i 16
nvm use 16

# making 16th version the default one (optional)
nvm alias default 16
```

## Check out

Check out the repository https://github.com/tomtom-international/maps-sdk-js:

```shell
git clone git@github.com:tomtom-international/maps-sdk-js.git
# or
git clone https://github.com/tomtom-international/maps-sdk-js.git
```

## Installation

```shell
# all workspaces
npm i -ws
npm ci -ws
# root project (currently only for docs generation)
npm i
npm ci

# specific workspaces
npm i -w core
npm i -w map
npm i -w services
# or
npm ci -w core
# and so on...
```

```node_modules``` directory appears not in workspaces, but in the root directory. This is how it should be.
