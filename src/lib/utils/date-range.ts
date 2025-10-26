import { addWeeks } from 'date-fns';

export function getRangeStart(range: string) {
  const now = new Date();
  switch (range) {
    case '12w':
      return addWeeks(now, -12);
    case '24w':
      return addWeeks(now, -24);
    default:
      return addWeeks(now, -8);
  }
}
