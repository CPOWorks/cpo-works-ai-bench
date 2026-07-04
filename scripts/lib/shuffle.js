// Fisher-Yates shuffle (does not mutate the input array).
export function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const LABEL_LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function labelFor(index) {
  if (index >= LABEL_LETTERS.length) {
    throw new Error("Too many models for single-letter labels");
  }
  return `model_${LABEL_LETTERS[index]}`;
}
