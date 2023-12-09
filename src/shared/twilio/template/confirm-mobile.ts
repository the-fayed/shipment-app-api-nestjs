export const customerMobileConfirmationTemplate = (token: string): string => {
  return `Thank you for signing up!
To complete your registration, please click the following link to verify your mobile number:
${process.env.BASEURL}/v1/auth/verify/customer-mobile/${token}`;
};

export const driverMobileConfirmationTemplate = (token: string): string => {
  return `Thank you for signing up!
To complete your registration, please click the following link to verify your mobile number:
${process.env.BASEURL}/v1/auth/verify/driver-mobile/${token}`;
};
