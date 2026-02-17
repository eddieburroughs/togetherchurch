# Feature Keys

Feature keys gate module access per organization. Each key maps to a plan tier via the `plan_features` table. Per-church overrides live in `church_feature_overrides`.

## Keys

| Key                            | Module         | Description                        |
| ------------------------------ | -------------- | ---------------------------------- |
| `core.people`                  | people         | Contact directory and profiles     |
| `core.events`                  | events         | Event calendar and management      |
| `core.forms`                   | forms          | Custom form builder                |
| `core.giving`                  | giving         | Giving link and partner directory  |
| `core.announcements`           | announcements  | Announcement posting and feed      |
| `core.messaging_sms`           | messaging      | SMS messaging                      |
| `core.messaging_email`         | messaging      | Email messaging                    |
| `engage.groups`                | groups         | Small groups management            |
| `engage.groups.chat`           | groups         | In-app group chat                  |
| `engage.groups.sms_mirror`     | groups         | SMS mirroring for group messages   |
| `engage.care_meals`            | care_meals     | Meal train / care coordination     |
| `services.kids_checkin`        | kids_checkin   | Child check-in system              |
| `services.kids_checkin.labels` | kids_checkin   | Printed security labels            |
| `engage.events.tickets`        | tickets        | Event ticketing                    |
| `org.campuses`                 | campuses       | Multi-campus management            |

## Plan Tiers

| Plan         | Sort | Includes                                                                 |
| ------------ | ---- | ------------------------------------------------------------------------ |
| `under_150`  | 1    | core.people, core.events, core.forms, core.giving, core.announcements, messaging |
| `151_500`    | 2    | above + engage.groups (chat, sms_mirror) + engage.care_meals                     |
| `501_800`    | 3    | above + services.kids_checkin (labels) + engage.events.tickets           |
| `801_plus`   | 4    | same as 501_800                                                          |
| `multisite`  | 5    | all features including org.campuses                                      |

## Resolution Order

1. Look up the church's plan via `church_subscriptions`.
2. Get enabled features from `plan_features` for that plan.
3. Apply any `church_feature_overrides` (can enable or disable individual keys).
4. The merged set determines what modules are accessible.
