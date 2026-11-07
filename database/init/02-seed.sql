-- Demo identities and templates. Images live in the backend classpath under /static/demo.
SET NAMES utf8mb4;

INSERT INTO app_user (id, display_name, email, avatar_color, account_tier) VALUES
    ('user-a', '林小满', 'lin.xiaoman@imageedit.demo', '#9BBF3E', 'PREMIUM'),
    ('user-b', '周予安', 'zhou.yuan@imageedit.demo', '#6C8AE4', 'STANDARD')
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name), email = VALUES(email), avatar_color = VALUES(avatar_color), account_tier = VALUES(account_tier);

INSERT INTO template
    (id, title, category, cover_url, description, required_image_count, accepted_mime_types,
     max_file_size_bytes, sample_result_url, result_caption, accent_color, sort_order)
VALUES
    ('travel-postcard', '旅行明信片', '旅行纪念',
     '/api/demo/covers/travel-postcard.svg',
     '上传一张旅途照片，生成一张可收藏的明信片，适合分享行程里的高光时刻。',
     1, 'image/jpeg,image/png', 5242880,
     '/api/demo/results/travel-postcard-sample.svg', 'TRAVEL POSTCARD', '#C8B273', 1),

    ('city-skyline', '城市天际线', '旅行纪念',
     '/api/demo/covers/city-skyline.svg',
     '精选一张城市照片，搭配渐变标题与留白边框，做一张安静的天际线海报。',
     1, 'image/jpeg,image/png', 5242880,
     '/api/demo/results/city-skyline-sample.svg', 'CITY SKYLINE', '#7AA2F7', 2),

    ('pet-portrait', '萌宠写真', '萌宠日常',
     '/api/demo/covers/pet-portrait.svg',
     '上传一张宠物照片，生成柔光背景的写真卡片，保留毛孩子最可爱的表情。',
     1, 'image/jpeg,image/png', 5242880,
     '/api/demo/results/pet-portrait-sample.svg', 'PET PORTRAIT', '#F2A7B5', 3),

    ('pet-duo', '双宝合影', '萌宠日常',
     '/api/demo/covers/pet-duo.svg',
     '上传一张萌宠照片，生成双宝合影风格的卡片，记录它们的日常。',
     1, 'image/jpeg,image/png', 5242880,
     '/api/demo/results/pet-duo-sample.svg', 'PET DUO', '#E0A458', 4),

    ('wedding-invite', '婚礼请柬', '婚礼庆典',
     '/api/demo/covers/wedding-invite.svg',
     '上传一张照片，生成简洁的婚礼主题请柬，适合作为电子邀请的预览。',
     1, 'image/jpeg,image/png', 5242880,
     '/api/demo/results/wedding-invite-sample.svg', 'WEDDING INVITATION', '#D9C7A7', 5),

    ('anniversary', '周年纪念', '婚礼庆典',
     '/api/demo/covers/anniversary.svg',
     '上传一张合照，生成带有纪念日氛围的留白海报，适合做成纪念卡片。',
     1, 'image/jpeg,image/png', 5242880,
     '/api/demo/results/anniversary-sample.svg', 'ANNIVERSARY', '#C9A7D9', 6),

    ('duo-collage', '双人拼贴', '创意海报',
     '/api/demo/covers/duo-collage.svg',
     '上传一张人物照片，生成左右分栏的拼贴作品，适合作为组合封面。',
     1, 'image/jpeg,image/png', 5242880,
     '/api/demo/results/duo-collage-sample.svg', 'DUO COLLAGE', '#8EC5A8', 7),

    ('holiday-card', '节日贺卡', '创意海报',
     '/api/demo/covers/holiday-card.svg',
     '上传一张照片，生成温暖配色的节日贺卡，为平常的问候增添仪式感。',
     1, 'image/jpeg,image/png', 5242880,
     '/api/demo/results/holiday-card-sample.svg', 'HOLIDAY CARD', '#E46B5C', 8)
ON DUPLICATE KEY UPDATE
    title = VALUES(title), category = VALUES(category), cover_url = VALUES(cover_url),
    description = VALUES(description), required_image_count = VALUES(required_image_count),
    accepted_mime_types = VALUES(accepted_mime_types), max_file_size_bytes = VALUES(max_file_size_bytes),
    sample_result_url = VALUES(sample_result_url), result_caption = VALUES(result_caption),
    accent_color = VALUES(accent_color), sort_order = VALUES(sort_order);
