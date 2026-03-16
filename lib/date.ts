import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";

export function getDateLocale(locale: string) {
  return locale === "ko" ? ko : enUS;
}

export function formatDateTime(date: string | Date, locale: string) {
  return format(new Date(date), "yyyy.MM.dd HH:mm", { locale: getDateLocale(locale) });
}

export function formatShortDate(date: string | Date, locale: string) {
  return format(new Date(date), "M/d HH:mm", { locale: getDateLocale(locale) });
}
