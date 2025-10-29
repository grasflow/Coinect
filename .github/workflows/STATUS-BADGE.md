# Status Badge dla CI/CD

Możesz dodać badge do README.md, który pokazuje status ostatniego uruchomienia pipeline.

## Badge URL

Dodaj na początku README.md (pod tytułem):

```markdown
[![CI Pipeline](https://github.com/{OWNER}/{REPO}/actions/workflows/ci.yml/badge.svg)](https://github.com/{OWNER}/{REPO}/actions/workflows/ci.yml)
```

Zamień `{OWNER}` na nazwę użytkownika/organizacji, a `{REPO}` na nazwę repozytorium.

### Przykład:

```markdown
[![CI Pipeline](https://github.com/johndoe/coinect/actions/workflows/ci.yml/badge.svg)](https://github.com/johndoe/coinect/actions/workflows/ci.yml)
```

## Dodatkowe badge'e

### Coverage Badge

Jeśli używasz Codecov lub Coveralls:

```markdown
[![codecov](https://codecov.io/gh/{OWNER}/{REPO}/branch/master/graph/badge.svg)](https://codecov.io/gh/{OWNER}/{REPO})
```

### License Badge

```markdown
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
```

### Node Version Badge

```markdown
[![Node Version](https://img.shields.io/badge/node-22.14.0-brightgreen.svg)](https://nodejs.org/)
```

## Przykładowy header README.md

```markdown
# Coinect

[![CI Pipeline](https://github.com/{OWNER}/{REPO}/actions/workflows/ci.yml/badge.svg)](https://github.com/{OWNER}/{REPO}/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-22.14.0-brightgreen.svg)](https://nodejs.org/)

> Professional invoicing and time tracking for freelancers
```
