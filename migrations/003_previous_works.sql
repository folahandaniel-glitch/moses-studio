-- Rename "Precious Works" to "Previous Works" wherever the original default text is still in use.
update ms_content_blocks set data = data
    || case when data->>'precious_title' = 'Precious Works' then jsonb_build_object('precious_title', 'Previous Works') else '{}'::jsonb end
    || case when data->>'precious_intro' = 'Signature projects we are proudest of.' then jsonb_build_object('precious_intro', 'Projects we have delivered before.') else '{}'::jsonb end
  where section = 'headings';
update ms_content_blocks set data = data || jsonb_build_object('description', replace(data->>'description', 'our precious, ongoing and ready works', 'our previous, ongoing and ready works'))
  where section = 'seo' and data->>'description' like '%our precious, ongoing and ready works%';
