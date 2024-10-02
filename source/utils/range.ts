type Range = {
  min: number;
  max: number;
};
  
const range = (min: number, max: number): Range => ({ 
  min,
  max,
});

const randomRange = ({ min, max }: Range): number => {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

export type {
  Range,
};

export {
  range,
  randomRange,
};
