SET NAMES utf8mb4;

INSERT INTO template
    (id, title, category, cover_url, description, required_image_count, accepted_mime_types,
     max_file_size_bytes, sample_result_url, result_caption, accent_color, sort_order)
VALUES
    ('winter-lights', '冬夜灯影', '创意海报',
     '/api/demo/results/holiday-card-sample.svg', '用一张照片制作冬日贺卡。',
     1, 'image/jpeg,image/png', 5242880,
     '/api/demo/results/holiday-card-sample.svg', 'WINTER LIGHTS', '#DDA671', 9),
    ('portrait-study', '光影肖像', '创意海报',
     '/sample-photos/portrait-in-shadow.jpg', '用一张人像制作写真海报。',
     1, 'image/jpeg,image/png', 5242880,
     '/api/demo/results/pet-portrait-sample.svg', 'PORTRAIT STUDY', '#9C887A', 10),
    ('winter-duet', '冬日双图', '创意海报',
     '/sample-photos/winter-evergreen.jpg', '用两张照片制作冬日拼贴。',
     2, 'image/jpeg,image/png', 5242880,
     '/api/demo/results/duo-collage-sample.svg', 'WINTER DUET', '#8DAE9D', 11)
ON DUPLICATE KEY UPDATE
    title = VALUES(title), category = VALUES(category), cover_url = VALUES(cover_url),
    description = VALUES(description), required_image_count = VALUES(required_image_count),
    accepted_mime_types = VALUES(accepted_mime_types), max_file_size_bytes = VALUES(max_file_size_bytes),
    sample_result_url = VALUES(sample_result_url), result_caption = VALUES(result_caption),
    accent_color = VALUES(accent_color), sort_order = VALUES(sort_order);
