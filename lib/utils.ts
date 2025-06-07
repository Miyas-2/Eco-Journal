import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function simpleMarkdownToHtml(text: string) {
  // Bold: **text** → <strong>text</strong>
  let html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // List: baris diawali - atau * → <li>
  html = html.replace(/(?:^|\n)[*-]\s?(.*?)(?=\n|$)/g, '<li>$1</li>');
  if (html.includes('<li>')) {
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
  }
  // Heading markdown (#) → <b>
  html = html.replace(/^#+\s?(.*)$/gm, '<b>$1</b>');
  // Ganti newline dengan <br> agar tetap rapi
  html = html.replace(/\n/g, '<br>');
  return html;
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
