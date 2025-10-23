import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}



/**
 * Generate an acronym from a department name
 * Takes the first capital letter of each word
 * Example: "College of Arts and Science" -> "CAS"
 */
export function generateAcronym(name: string): string {
  // keep only words that start with an uppercase letter (same behavior as before)
  const words = name.split(/\s+/).filter(word => /^[A-Z]/.test(word));
  const initials = words.map(word => word.charAt(0)).join('');

  // If the simple acronym yields exactly 2 letters and we have at least 2 meaningful words,
  // return <firstInitial> + <first 3 letters of second word (Title-cased)>
  if (initials.length === 2 && words.length >= 2) {
    const firstInitial = words[0].charAt(0);
    const secondWord = words[1];
    const abbrev = secondWord.slice(0, 3); // may be shorter than 3 if word is short
    const secondFormatted = abbrev.charAt(0).toUpperCase() + abbrev.slice(1).toLowerCase();
    return `${firstInitial}${secondFormatted}`;
  }

  return initials;
}