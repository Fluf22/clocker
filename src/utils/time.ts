export function padTime(value: string): string {
  const parts = value.split(":");
  const hours = (parts[0] ?? "00").padStart(2, "0");
  const minutes = (parts[1] ?? "00").padStart(2, "0");
  return `${hours}:${minutes}`;
}

function adjustWithWrap(value: number, delta: number, min: number, max: number): number {
  let newValue = value + delta;
  if (newValue > max) newValue = min;
  if (newValue < min) newValue = max;
  return newValue;
}

export function adjustTimeDigit(time: string, position: number, delta: number): string {
  const padded = padTime(time);
  const hours = parseInt(padded.slice(0, 2), 10);
  const minutes = parseInt(padded.slice(3, 5), 10);

  let newHours = hours;
  let newMinutes = minutes;

  switch (position) {
    case 0:
      newHours = adjustWithWrap(hours, delta * 10, 0, 23);
      break;
    case 1:
      newHours = adjustWithWrap(hours, delta, 0, 23);
      break;
    case 2:
      newMinutes = adjustWithWrap(minutes, delta * 10, 0, 59);
      break;
    case 3:
      newMinutes = adjustWithWrap(minutes, delta, 0, 59);
      break;
  }

  return `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}`;
}
