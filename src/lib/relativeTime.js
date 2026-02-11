import * as R from "ramda";

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;
const MONTH = 2592000;
const YEAR = 31536000;

const thresholds = [
  [R.gte(MINUTE), R.always("just now")],
  [R.gte(HOUR), (s) => `${Math.floor(s / MINUTE)}m ago`],
  [R.gte(DAY), (s) => `${Math.floor(s / HOUR)}h ago`],
  [R.gte(MONTH), (s) => `${Math.floor(s / DAY)}d ago`],
  [R.gte(YEAR), (s) => `${Math.floor(s / MONTH)}mo ago`],
  [R.T, (s) => `${Math.floor(s / YEAR)}y ago`],
];

export const formatRelativeTime = (unixTimestamp) => {
  const diff = Math.floor(Date.now() / 1000) - unixTimestamp;
  const seconds = R.max(0, diff);
  return R.cond(thresholds)(seconds);
};
