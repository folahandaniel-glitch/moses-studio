-- Colourful default palette. Sites still on the original bronze default get the new palette;
-- sites that were already customised keep their colours and only receive the new keys.
update ms_content_blocks set data = data || jsonb_build_object(
    'accent', '#5B4BDB', 'accent2', '#0EA5A4', 'accent3', '#F97316', 'background', '#FAFAFF', 'text', '#14142B',
    'footer_bg', '#14142B', 'color_precious', '#D97706', 'color_ongoing', '#2563EB', 'color_ready', '#059669'
  )
  where section = 'theme' and data->>'accent' = '#A8743B';

update ms_content_blocks set data = jsonb_build_object(
    'accent2', '#0EA5A4', 'accent3', '#F97316', 'footer_bg', '#14142B',
    'color_precious', '#D97706', 'color_ongoing', '#2563EB', 'color_ready', '#059669'
  ) || data
  where section = 'theme' and not (data ? 'accent2');

update ms_content_blocks set data = jsonb_build_object('backend_label', 'BackEnd') || data
  where section = 'footer' and not (data ? 'backend_label');
