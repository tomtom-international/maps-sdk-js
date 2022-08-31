[![Quality Gate Status](https://sonar.tomtomgroup.com/api/project_badges/measure?project=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc&metric=alert_status&token=squ_0df68ac0b54248e036ef46514c17158ed9e8d642)](https://sonar.tomtomgroup.com/dashboard?id=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc)
[![Reliability Rating](https://sonar.tomtomgroup.com/api/project_badges/measure?project=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc&metric=reliability_rating&token=squ_0df68ac0b54248e036ef46514c17158ed9e8d642)](https://sonar.tomtomgroup.com/dashboard?id=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc)
[![Maintainability Rating](https://sonar.tomtomgroup.com/api/project_badges/measure?project=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc&metric=sqale_rating&token=squ_0df68ac0b54248e036ef46514c17158ed9e8d642)](https://sonar.tomtomgroup.com/dashboard?id=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc)
[![Security Rating](https://sonar.tomtomgroup.com/api/project_badges/measure?project=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc&metric=security_rating&token=squ_0df68ac0b54248e036ef46514c17158ed9e8d642)](https://sonar.tomtomgroup.com/dashboard?id=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc)

[![Coverage](https://sonar.tomtomgroup.com/api/project_badges/measure?project=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc&metric=coverage&token=squ_0df68ac0b54248e036ef46514c17158ed9e8d642)](https://sonar.tomtomgroup.com/dashboard?id=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc)
[![Bugs](https://sonar.tomtomgroup.com/api/project_badges/measure?project=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc&metric=bugs&token=squ_0df68ac0b54248e036ef46514c17158ed9e8d642)](https://sonar.tomtomgroup.com/dashboard?id=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc)
[![Vulnerabilities](https://sonar.tomtomgroup.com/api/project_badges/measure?project=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc&metric=vulnerabilities&token=squ_0df68ac0b54248e036ef46514c17158ed9e8d642)](https://sonar.tomtomgroup.com/dashboard?id=tomtom-international_go-sdk-js_AYHTCTXCqdbqIGrKswTc)

<div align="center">
  <a href="https://github.com/tomtom-international/go-sdk-js">
    <img src="documentation/images/tt_logo.png" alt="Logo" width="400" height="90">
  </a>

  <h3 align="center">go-sdk-js</h3>

  <p align="center">
    GO SDK JS is a JavaScript library for building web applications using TomTom maps and location services
    <br />
    <a href="https://github.com/tomtom-international/go-sdk-js/tree/main/documentation"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/tomtom-international/go-sdk-js/issues">Report Bug</a>
    ·
    <a href="https://github.com/tomtom-international/go-sdk-js/issues">Request Feature</a>
  </p>
</div>
<br />
<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
      <li><a href="#what-is-go-sdk-for-web">What is GO-SDK for Web?</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>
<br />

<!-- ABOUT THE PROJECT -->
## About The Project

GO SDK JS is a JavaScript library for building web applications using TomTom maps and location services. With GO SDK JS you can build powerful web applications that seamlessly integrate TomTom's
mapping and service technologies including map display and interaction, search, routing, and traffic.

<br />

<!-- WHAT IS GO SDK WEB -->
## What is GO-SDK for Web?

Easily integrate TomTom services into your web application with this convenient client library that hides the complexity of bare RESTful service calls from developers. Boost your productivity with fully styleable and easily customized components. Check out the examples page for the most common use cases for your web application.

<!-- GETTING STARTED -->
## Getting Started

**TODO**: Explain how to install the sdk for normal usage of it.

To get start to contributing to **GO-SDK-WEB**, please follow the steps bellow.

<br />

### Prerequisites

Make sure you have installed the following applications:

* [Git](https://git-scm.com/) latest
* [NVM](https://github.com/nvm-sh/nvm) latest
* [NodeJS 16.+ (LTS)](https://nodejs.org/) - via NVM
* NPM 8.+ (correspondent to the LTS) - via NVM

<br />

1. Setup NodeJS/NPM via NVM
    ```shell
    nvm i 16
    nvm use 16

    # making 16th version the default one (optional)
    nvm alias default 16
    ```

2. Clone the repo
   ```sh
    git clone git@github.com:tomtom-international/go-sdk-js.git
    # or
    git clone https://github.com/tomtom-international/go-sdk-js.git
   ```

3. Install NPM packages
   ```sh
    npm i -ws
    npm ci -ws
    # root project (currently only for docs generation)
    npm i
    npm ci
   ```
   
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

## Development of go-sdk-js

* [Introduction](documentation/product-information/introduction.md)
* [Getting development started](documentation/development/getting-development-started.md)
* [Build workspaces](documentation/development/build-workspaces.md)
* [CI/CD](documentation/development/ci-cd.md)
* [Testing your changes](documentation/development/testing.md)
* [Updating dependencies](documentation/development/dependencies-updating.md)
* [Quality control](documentation/development/quality-control.md)
* [Generating documentation](documentation/development/docs.md)

## Parts of go-sdk-js

### Core

TODO

### Services

* [Search](documentation/services/search/documentation.md)
* [Reverse Geocoding](documentation/services/search/search-examples/reverse-geocoding.md)

### Map

TODO
