import { cookies } from 'next/headers';
import { getDictionary } from './dictionaries';

export async function getServerLocale(): Promise<string> {
  const cookieStore = await cookies();
  return cookieStore.get('NEXT_LOCALE')?.value || 'en-us';
}

export function localeToDict(locale: string): string {
  if (locale.startsWith('es')) return 'es';
  return 'en';
}

export async function getServerDictionary() {
  const locale = await getServerLocale();
  const dictLocale = localeToDict(locale);
  return getDictionary(dictLocale);
}
