# Feature Keys

Feature keys gate module access per organization. Each key maps to a subscription plan tier.

> This file will be seeded with real keys in a later prompt.

## Placeholder Keys

| Key               | Module         | Plan  |
| ----------------- | -------------- | ----- |
| `core`            | core           | free  |
| `people`          | people         | free  |
| `events`          | events         | basic |
| `forms`           | forms          | basic |
| `messaging`       | messaging      | pro   |
| `groups`          | groups         | basic |
| `care_meals`      | care_meals     | pro   |
| `kids_checkin`    | kids_checkin   | pro   |
| `tickets`         | tickets        | pro   |
| `campuses`        | campuses       | enterprise |

## Plan Tiers

| Tier         | Includes                                      |
| ------------ | --------------------------------------------- |
| `free`       | core, people                                  |
| `basic`      | free + events, forms, groups                  |
| `pro`        | basic + messaging, care_meals, kids_checkin, tickets |
| `enterprise` | pro + campuses                                |
