# fragments

# CCP555 Fragments

### Instructions on how to run the various scripts (i.e., lint, start, dev, debug)

```json
"scripts": {
  "lint": "eslint \"./src/**/*.js\"",
  "start": "node src/server.js",
  "dev": "LOG_LEVEL=debug nodemon ./src/server.js --watch src",
  "debug": "LOG_LEVEL=debug nodemon --inspect=0.0.0.0:9229 ./src/server.js --watch src"
},
```

```sh
npm run lint
```

Run `eslint` and make sure there are no errors that need to be fixed.

```sh
npm start
```

The `start` script runs our server normally.

```sh
npm run dev
```

The `dev` script runs our server via nodemon, which watches the `src/**` folder for any changes, restarting the server whenever something is changes.

```sh
npm run debug
```

the `debug` script is the same as `dev` but also starts the `node inspector` on port 9229, which is attached into `VSCode Debugger`.

Try setting a breakpoint in your Health Check route (src/app.js) (i.e., on the line res.status(200).json({) and start the server via `VSCode's debugger`. Use `curl/curl.exe` or your `browser` to load http://localhost:8080 and watch your breakpoint get hit.

```json
  "scripts": {
    "test:integration": "hurl --test --glob \"tests/integration/**/*.hurl\"",
    "test:watch": "jest -c jest.config.js --runInBand --watch --",
    "test": "jest -c jest.config.js --runInBand --",
    "coverage": "jest -c jest.config.js --runInBand --coverage",
  }
```

Add some **npm scripts** to your `package.json` to run our **unit tests**. We'll run our tests in various ways:

- `test:integration` - run Hurl and our integration tests.
- `test` - run all tests using our `jest.config.js` configuration [one-by-one](https://jestjs.io/docs/cli#--runinband) vs. in parallel (it's easier to test serially than in parallel). The final `--` means that we'll pass any arguments we receive via the `npm` invocation to Jest, allowing us to run a single test or set of tests. More on this below.
- `test:watch` - same idea as `test`, but don't quit when the tests are finished. Instead, **watch** the files for changes and re-run tests when we update our code (e.g., save a file). This is helpful when you're editing code and want to run tests in a loop as you edit and save the code.
- `coverage` - same idea as `test` but collect test [coverage](https://jestjs.io/docs/cli#--coverageboolean) information, so that we can see which files and lines of code are being tested, and which ones aren't. More on this below.

You could also run **a single test file** by passing all, or part of its name:
`npm test get.test.js` will run only get.test.js.
The same trick works with `npm run test:watch get.test.js`.
