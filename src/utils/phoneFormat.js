/**
 * Formats an Uzbekistan phone number automatically with "+998 " prefix
 * and spaces as: +998 99 585 45 65
 */
export function formatUzPhone(rawInput) {
  if (rawInput === undefined || rawInput === null || rawInput === '') {
    return '+998 ';
  }

  const str = String(rawInput);
  const digits = str.replace(/\D/g, '');

  // If the string starts with '+' and digits are just a prefix of '998' (e.g. user pressed Backspace on '+998 ')
  if (str.trim().startsWith('+') && ('998'.startsWith(digits) || digits === '')) {
    return '+998 ';
  }

  // Extract subscriber digits (up to 9 digits after 998)
  let subscriber = digits;
  while (subscriber.startsWith('998') && subscriber.length > 9) {
    subscriber = subscriber.slice(3);
  }
  if (subscriber.startsWith('998')) {
    subscriber = subscriber.slice(3);
  }
  subscriber = subscriber.slice(0, 9);

  if (!subscriber) {
    return '+998 ';
  }

  let formatted = '+998 ';
  if (subscriber.length <= 2) {
    formatted += subscriber;
  } else if (subscriber.length <= 5) {
    formatted += `${subscriber.slice(0, 2)} ${subscriber.slice(2)}`;
  } else if (subscriber.length <= 7) {
    formatted += `${subscriber.slice(0, 2)} ${subscriber.slice(2, 5)} ${subscriber.slice(5)}`;
  } else {
    formatted += `${subscriber.slice(0, 2)} ${subscriber.slice(2, 5)} ${subscriber.slice(5, 7)} ${subscriber.slice(7, 9)}`;
  }

  return formatted;
}

/**
 * Returns empty string if only the '+998' prefix is present without subscriber digits.
 * Otherwise returns the trimmed phone number string.
 */
export function cleanUzPhone(val) {
  if (!val) return '';
  const str = String(val).trim();
  const digits = str.replace(/\D/g, '');
  if (!digits || (str.startsWith('+') && '998'.startsWith(digits)) || digits === '998') {
    return '';
  }
  return str;
}
