import { ItemCategory } from '../generated/prisma/enums.js';

const CATEGORY_PROMPTS: Partial<Record<ItemCategory, string[]>> = {
  PHONE: ['Describe the wallpaper or lock screen.', 'Describe the case, stickers, or scratches.', 'Name another identifying detail not shown publicly.'],
  BOOK: ['Is a name or note written inside?', 'Describe highlights, folds, or page marks.', 'Name another identifying detail not shown publicly.'],
  ID_CARD: ['What exact name or identifier is printed?', 'Describe any holder, lanyard, or marks.', 'Name another identifying detail not shown publicly.'],
  WALLET: ['Describe something inside the wallet.', 'Describe wear, marks, or compartments.', 'Name another identifying detail not shown publicly.'],
};

export function fallbackPrompts(category: ItemCategory) {
  const prompts = CATEGORY_PROMPTS[category] ?? [
    'Describe a hidden identifying mark.',
    'What detail would only the owner know?',
    'Describe another non-public identifying feature.',
  ];
  return prompts.map((text, index) => ({ id: `p${index + 1}`, text }));
}
