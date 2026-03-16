const dictionaries = {
  en: () => import('./dictionaries/en.json').then((m) => m.default),
  es: () => import('./dictionaries/es.json').then((m) => m.default),
};

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;

export const getDictionary = async (locale: string) => {
  const loader = dictionaries[locale as keyof typeof dictionaries];
  if (!loader) return dictionaries.en();
  return loader();
};
