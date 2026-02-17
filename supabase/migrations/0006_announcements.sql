-- Announcements feature key
insert into features (key, description) values
  ('core.announcements', 'Announcement posting and feed');

-- Map to all plans (announcements is fundamental)
insert into plan_features (plan_id, feature_key)
select p.id, 'core.announcements'
from plans p
where p.slug in ('under_150', '151_500', '501_800', '801_plus', 'multisite');
