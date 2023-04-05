[![Quality Gate Status](https://sonar.tomtomgroup.com/api/project_badges/measure?project=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc&metric=alert_status&token=squ_0df68ac0b54248e036ef46514c17158ed9e8d642)](https://sonar.tomtomgroup.com/dashboard?id=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc)
[![Reliability Rating](https://sonar.tomtomgroup.com/api/project_badges/measure?project=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc&metric=reliability_rating&token=squ_0df68ac0b54248e036ef46514c17158ed9e8d642)](https://sonar.tomtomgroup.com/dashboard?id=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc)
[![Maintainability Rating](https://sonar.tomtomgroup.com/api/project_badges/measure?project=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc&metric=sqale_rating&token=squ_0df68ac0b54248e036ef46514c17158ed9e8d642)](https://sonar.tomtomgroup.com/dashboard?id=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc)
[![Security Rating](https://sonar.tomtomgroup.com/api/project_badges/measure?project=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc&metric=security_rating&token=squ_0df68ac0b54248e036ef46514c17158ed9e8d642)](https://sonar.tomtomgroup.com/dashboard?id=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc)

[![Coverage](https://sonar.tomtomgroup.com/api/project_badges/measure?project=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc&metric=coverage&token=squ_0df68ac0b54248e036ef46514c17158ed9e8d642)](https://sonar.tomtomgroup.com/dashboard?id=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc)
[![Bugs](https://sonar.tomtomgroup.com/api/project_badges/measure?project=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc&metric=bugs&token=squ_0df68ac0b54248e036ef46514c17158ed9e8d642)](https://sonar.tomtomgroup.com/dashboard?id=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc)
[![Vulnerabilities](https://sonar.tomtomgroup.com/api/project_badges/measure?project=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc&metric=vulnerabilities&token=squ_0df68ac0b54248e036ef46514c17158ed9e8d642)](https://sonar.tomtomgroup.com/dashboard?id=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc)

# SDK Development

Here you can find how to develop in the SDK itself.

## Tooling

Make sure you have installed the following applications:

* [Git](https://git-scm.com/) latest
* [NodeJS 18.+ (LTS)](https://nodejs.org/) - Please check the Pre-installation section
* NPM 9.+ (correspondent to the LTS) - Please check the Pre-installation section

We know that handling node versions without a proper tool can be tricky. There are two tools you can use to manage node versions, [NVM](https://github.com/nvm-sh/nvm) and [Volta](https://volta.sh/).

<br />

**Using Volta:**

Volta is a tool that automatically change the **node** and **npm** version for you and if you don't have installed, it will download automatically and setup for you.

> "Volta is a hassle-free way to manage your JavaScript command-line tools."

Setup Volta:
  ```shell
    curl https://get.volta.sh | bash
  ```

The project has already **node** and **npm** version pinned in the package.json file in the root folder.

Read more about Volta here: [https://docs.volta.sh/guide/](https://docs.volta.sh/guide/)

<br />

**Using NVM**:

Setup NodeJS/NPM via NVM
  ```shell
    nvm i 18
    nvm use 18

    # making 16th version the default one (optional)
    nvm alias default 18
  ```

Read more about NVM here: [https://github.com/nvm-sh/nvm](https://github.com/nvm-sh/nvm)

<br />

## Installation

1. Clone the repo
   ```sh
    git clone git@github.com:tomtom-international/maps-sdk-js.git
    # or
    git clone https://github.com/tomtom-international/maps-sdk-js.git
   ```

2. Install NPM packages

You will need install first the packages in the root folder:

  ```sh
    npm i
  ```
This is necessary for documentation generation and git hooks to work properly.

You can also install packages for a certain workspace:
  ```sh
        # specific workspaces
        npm i -w core
        npm i -w map
        npm i -w services
        # or
        npm ci -w core
        # and so on...
  ```

>```node_modules``` directory appears not in workspaces, but in the root directory. This is how it should be.

## Development of maps-sdk-js

* [Introduction](documentation/product-information/introduction.md)
* [Getting development started](documentation/development/getting-development-started.md)
* [Build workspaces](documentation/development/build-workspaces.md)
* [CI/CD](documentation/development/ci-cd.md)
* [Testing your changes](documentation/development/testing.md)
* [Updating dependencies](documentation/development/dependencies-updating.md)
* [Quality control](documentation/development/quality-control.md)
* [Generating documentation](documentation/development/docs.md)
