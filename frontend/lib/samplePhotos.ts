export const photoSets = {
  '旅行纪念': ['mountain-travel', 'city-travel'],
  '萌宠日常': ['dogs-outdoors', 'pet-portrait'],
  '婚礼庆典': ['wedding-portrait', 'wedding-detail']
} as const;

export function samplePhotos(category: string, templateId?: string): readonly string[] {
  if (templateId === 'holiday-card' || templateId === 'winter-lights' || templateId === 'winter-duet' || templateId === 'evergreen-card') return ['winter-lights', 'winter-evergreen'];
  if (templateId === 'duo-collage' || templateId === 'portrait-study' || templateId === 'portrait-pair') return ['portrait-in-shadow', 'wedding-portrait'];
  return photoSets[category as keyof typeof photoSets] ?? [];
}

export function samplePhotoUrl(name: string) {
  return '/sample-photos/' + name + '.jpg';
}
