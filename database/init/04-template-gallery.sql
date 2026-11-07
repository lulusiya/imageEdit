SET NAMES utf8mb4;

INSERT IGNORE INTO template (id,title,category,cover_url,description,required_image_count,accepted_mime_types,max_file_size_bytes,sample_result_url,result_caption,accent_color,sort_order)
SELECT 'alpine-journal', '山间手记', category, '/sample-photos/alpine-journal.jpg',
       '上传照片制作山间手记。', 1, accepted_mime_types, max_file_size_bytes,
       sample_result_url, 'ALPINE JOURNAL', accent_color, 12
FROM template WHERE id = 'travel-postcard';

INSERT IGNORE INTO template (id,title,category,cover_url,description,required_image_count,accepted_mime_types,max_file_size_bytes,sample_result_url,result_caption,accent_color,sort_order)
SELECT 'city-weekend', '城市周末', category, '/sample-photos/city-weekend.jpg',
       '上传照片制作城市周末。', 1, accepted_mime_types, max_file_size_bytes,
       sample_result_url, 'CITY WEEKEND', accent_color, 13
FROM template WHERE id = 'city-skyline';

INSERT IGNORE INTO template (id,title,category,cover_url,description,required_image_count,accepted_mime_types,max_file_size_bytes,sample_result_url,result_caption,accent_color,sort_order)
SELECT 'journey-pair', '旅途双页', category, '/sample-photos/journey-pair.jpg',
       '上传照片制作旅途双页。', 2, accepted_mime_types, max_file_size_bytes,
       sample_result_url, 'TRAVEL DIPTYCH', accent_color, 14
FROM template WHERE id = 'travel-postcard';

INSERT IGNORE INTO template (id,title,category,cover_url,description,required_image_count,accepted_mime_types,max_file_size_bytes,sample_result_url,result_caption,accent_color,sort_order)
SELECT 'pet-closeup', '宠物特写', category, '/sample-photos/pet-closeup.jpg',
       '上传照片制作宠物特写。', 1, accepted_mime_types, max_file_size_bytes,
       sample_result_url, 'PET CLOSE-UP', accent_color, 15
FROM template WHERE id = 'pet-portrait';

INSERT IGNORE INTO template (id,title,category,cover_url,description,required_image_count,accepted_mime_types,max_file_size_bytes,sample_result_url,result_caption,accent_color,sort_order)
SELECT 'park-pals', '公园伙伴', category, '/sample-photos/park-pals.jpg',
       '上传照片制作公园伙伴。', 2, accepted_mime_types, max_file_size_bytes,
       sample_result_url, 'PARK PALS', accent_color, 16
FROM template WHERE id = 'pet-duo';

INSERT IGNORE INTO template (id,title,category,cover_url,description,required_image_count,accepted_mime_types,max_file_size_bytes,sample_result_url,result_caption,accent_color,sort_order)
SELECT 'wedding-moments', '婚礼瞬间', category, '/sample-photos/wedding-moments.jpg',
       '上传照片制作婚礼瞬间。', 2, accepted_mime_types, max_file_size_bytes,
       sample_result_url, 'WEDDING MOMENTS', accent_color, 17
FROM template WHERE id = 'wedding-invite';

INSERT IGNORE INTO template (id,title,category,cover_url,description,required_image_count,accepted_mime_types,max_file_size_bytes,sample_result_url,result_caption,accent_color,sort_order)
SELECT 'anniversary-print', '纪念影印', category, '/sample-photos/anniversary-print.jpg',
       '上传照片制作纪念影印。', 1, accepted_mime_types, max_file_size_bytes,
       sample_result_url, 'ANNIVERSARY PRINT', accent_color, 18
FROM template WHERE id = 'anniversary';

INSERT IGNORE INTO template (id,title,category,cover_url,description,required_image_count,accepted_mime_types,max_file_size_bytes,sample_result_url,result_caption,accent_color,sort_order)
SELECT 'portrait-pair', '肖像双联', category, '/sample-photos/portrait-pair.jpg',
       '上传照片制作肖像双联。', 2, accepted_mime_types, max_file_size_bytes,
       sample_result_url, 'PORTRAIT PAIR', accent_color, 19
FROM template WHERE id = 'duo-collage';

INSERT IGNORE INTO template (id,title,category,cover_url,description,required_image_count,accepted_mime_types,max_file_size_bytes,sample_result_url,result_caption,accent_color,sort_order)
SELECT 'evergreen-card', '常青贺卡', category, '/sample-photos/evergreen-card.jpg',
       '上传照片制作常青贺卡。', 1, accepted_mime_types, max_file_size_bytes,
       sample_result_url, 'EVERGREEN CARD', accent_color, 20
FROM template WHERE id = 'holiday-card';
