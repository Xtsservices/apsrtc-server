import moment from 'moment-timezone';

// Set default timezone to Asia/Kolkata
moment.tz.setDefault('Asia/Kolkata');

export const getCurrentUnixTime = (): number => {
  return moment().unix();
};

export const getUnixTimeFromNow = (amount: number, unit: moment.unitOfTime.DurationConstructor): number => {
  return moment().add(amount, unit).unix();
};

export const isUnixTimeExpired = (unixTime: number): boolean => {
  return unixTime < moment().unix();
};
