# Information

CMS is a generically branded Content Management System (CMS), created for demonstrative purposes and uses a combination of technologies and external services.

# Getting Started

## System Requirements

- Node.js 14.10.1
- npm 6.14.8
- PostgreSQL 12.5
  - Extensions
    - PL/pgSQL
    - intarray
- Redis 5.0.7

## Additional Prerequisites

- [Pexels API key](https://www.pexels.com/api/new/)
- Empty database

## Setup

Clone the repository.

```console
$ git clone https://github.com/j-wenning/cms.git
```

Install dependencies.

```console
$ npm install
```

Copy .env.example to .env and populate empty fields.\
Feel free to change the other variables if you know what you're doing.

```console
$ cp .env.example .env
$ vim .env
```

```shell
DEV_PORT=3000
PORT=3001
DB_URL=postgres://username:password@host:port/database
SESSION_SECRET=a1a1a1a1a1a1
SESSION_EXPIRY=43200000
QTY_REFRESH=604800000
PEXELS_API_KEY=a1a1a1a1a1a1a1a1a1
```

Import database schema.

```console
$ npm run db:import
```

Populate the database.

```console
$ npm run fake
```

>Remember that this is using your Pexels API credentials, so try    to respect their rate limits of 200 requests per hour, 20,000   per month!\
Mileage may vary, some products will not have images generated for them for whatever reason, hence the default image fallback.

Build the project - Trust me, it's faster than running the DevServer.

```console
$ npm run build
```

Start the server.

```console
$ npm start
```

Once started, you can view the application on [http://localhost:3000](http://localhost:3000) (or whichever port you set in `.env`).

## Available Scripts

### `npm run build`

Builds the app for production to the `build` folder.\
The build is minified and the filenames include the hashes.

### `npm run db:import`

Imports database schema using supplied connection string in `.env`.

### `npm run fake`

Generates random products for the database using supplied connection string and Pexels API key in `.env`.\
Utilizes [faker.js](https://www.npmjs.com/package/faker) and the [Pexels API](https://www.pexels.com/api/).

### `npm start`

Runs the app in production mode using supplied port in `.env`.\
Be sure to run `build`, `db:import`, and `fake` first.

### `npm run dev`

Runs [Webpack DevServer](https://webpack.js.org/configuration/dev-server/) and server backend on supplied dev port and port in `.env` respectively.\
Hot reloads and source maps are enabled.

### `npm test` *

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

---

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

\* Supplied by Create React App, may or may not still be functional.
