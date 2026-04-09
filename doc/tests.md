# Running Unit Tests

The project uses [Karma](https://karma-runner.github.io/) as the test runner and [Jasmine](https://jasmine.github.io/) as the testing framework. Tests are files matching the pattern `**/*.spec.ts` inside `src/`.

## Run all tests

```bash
ng test
```

or equivalently:

```bash
npm test
```

This opens a Chrome browser window, runs every `*.spec.ts` file, and watches for changes.

## Run tests once (no watch / CI mode)

```bash
ng test --watch=false
```

## Run tests in a headless browser

The default browser is `ChromiumHeadless`. You can override it with `--browsers`:

```bash
ng test --watch=false --browsers=ChromiumHeadless
```

Other supported values: `Chromium`, `ChromeHeadless`, `Chrome`, `Firefox`.

## Run a specific test file

Use the `--include` flag with a glob relative to the project root:

```bash
ng test --include=src/app/matches/match-combos/match-combos-from-json.spec.ts
```

## Run tests matching a pattern

You can filter by `describe` or `it` description via the Karma/Jasmine `--grep` option (passed through `--` to Karma):

```bash
ng test -- --grep="team balancing"
```

## Code coverage

```bash
ng test --watch=false --code-coverage
```

The coverage report is generated in `coverage/team-balancer/`.
