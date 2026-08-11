<p align="center">
  <a href="https://material-ui.com/" rel="noopener" target="_blank"><img width="150" src="https://archival-iiif.github.io/logos/iiif.png" alt="Material-UI logo"></a>
</p>

<h1 align="center">Archival IIIF image core</h1>

<div align="center">
Archival IIIF image core provides the core functionality to build a IIIF image server, but also provides a server ready-to-go.
</div>

## IIIF Image API

The web server exposes an [IIIF Image API 3.0](https://iiif.io/api/image/3.0/) compliant service.

**URL**: `/[id]/[region]/[size]/[rotation]/[quality].[format]`

**Method**: `GET`

For example:

```
http://localhost:3333/example.jpg/full/!100,100/0/default.jpg
```

The optional `max` query parameter limits the image dimensions exposed to the request. It must be a positive integer:

```
http://localhost:3333/example.tif/full/max/0/default.jpg?max=5000
```

**URL**: `/[id]/info.json`

**Method**: `GET`

The endpoint returns IIIF Image API 3 metadata. It also accepts the same optional `max` parameter:

```
http://localhost:3333/example.tif/info.json
http://localhost:3333/example.tif/info.json?max=5000
```

**URL**: `/viewer?iiif=[encoded-info.json-URI]`

**Method**: `GET`

The bundled full-page [OpenSeadragon](https://openseadragon.github.io/) viewer can be used to interact with the images
using IIIF using the `iiif` query parameter. For example:

```
http://localhost:3333/viewer?iiif=http%3A%2F%2Flocalhost%3A3333%2Fexample.tif%2Finfo.json
```

## Installation

1. Install
    * [Node.js 24.x LTS](https://nodejs.org/en)
    * [yarn](https://yarnpkg.com) or [npm](https://www.npmjs.com)
2. Install dependencies
   ```sh
   // with npm
   npm install
   
   // with yarn
   yarn install
   ```

## Run the provided image server

You can run the provided IIIF image server with the following possible arguments:

```sh
// with npm
npm run start -- [arguments]

// with yarn
yarn run start -- [arguments]

// with docker
docker run -d -p 3333:3333 [image] [arguments]
```

<table>
    <thead>
        <tr>
            <td>Arguments</td>
            <td>Description</td>
            <td>Default value</td>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>-d</code> | <code>--debug</code></td>
            <td>Specify flag for debug messages</td>
            <td><code>false</code></td>
        </tr>
        <tr>
            <td><code>-p</code> | <code>--port</code></td>
            <td>Server port</td>
            <td><code>3333</code></td>
        </tr>
        <tr>
            <td><code>-r</code> | <code>--root</code></td>
            <td>Root path to images</td>
            <td>&nbsp;</td>
        </tr>
        <tr>
            <td><code>-c</code> | <code>--concurrency</code></td>
            <td>Control the number of threads libvips can use for image processing</td>
            <td><code>0</code> (The number of CPU cores available)</td>
        </tr>
    </tbody>
</table>
