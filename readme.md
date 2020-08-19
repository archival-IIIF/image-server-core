# Archival IIIF image

Archival IIIF image server is an implementation of the IIIF Image API.

## Web API

_See also the [IIIF Image API 2.1](https://iiif.io/api/image/2.1/) 
and the [IIIF Image API 3.0](https://iiif.io/api/image/3.0/)_

**URL**: `[id]/[region]/[size]/[rotation]/[quality].[format]`

**Method**: `GET`

E.g. http://localhost:3333/example.jpg/full/!100,100/0/default.jpg

## Installation

Use the provided Docker Compose or install manually.

### Manual installation

1. Install
    * [Node.js 12.x LTS](https://nodejs.org/en)
    * [yarn](https://yarnpkg.com) or [npm](https://www.npmjs.com)
1. Set up the configuration (See .env.example for the example configuration)
    * Copy .env.example to .env and set up the parameters for development
    * Set up the environment variables for production (see above)
    with the environment variables
1. `yarn install` or `npm install`
1. Start the application:
    * Run `yarn run start` or `npm run start`

## Configuration

<table>
    <thead>
        <tr>
            <td>Key</td>
            <td>Description</td>
            <td>Example | Values</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>NODE_ENV</td>
            <td>Environment type</td>
            <td><code>development or production</code></td>
        </tr>
        <tr>
            <td>IIIF_IMAGE_PORT</td>
            <td>Server Port</td>
            <td>E.g. <code>3333</code></td>
        </tr>
        <tr>
            <td>IIIF_IMAGE_ROOT_PATH</td>
            <td>Path to images</td>
            <td>E.g. <code>/data</code></td>
        </tr>
        <tr>
            <td>IIIF_IMAGE_LOG_LEVEL</td>
            <td>Winston log level</td>
            <td>E.g. <code>debug</code> see <a href="https://github.com/winstonjs/winston#logging-levels">here</a></td>
        </tr>
    </tbody>
</table>
