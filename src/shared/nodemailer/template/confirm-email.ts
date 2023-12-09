export const customerEmailConfirmationTemplate = (token: string) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }

    .container {
      max-width: 600px;
      margin: 50px auto;
      background-color: #ffffff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }

    h2 {
      color: #333333;
    }

    p {
      color: #555555;
    }

    .verification-link {
      display: inline-block;
      padding: 10px 20px;
      background-color: #007BFF;
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
    }

    .footer {
      margin-top: 20px;
      text-align: center;
      color: #888888;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Email Verification</h2>
    <p>
      Thank you for signing up! To complete your registration, please click the following link to verify your email address:
    </p>
    <p>
      <a href="${process.env.BASEURL}/v1/auth/verify/customer-email/${token}" class="verification-link">Verify Email</a>
    </p>
    <p>
      If you did not sign up for this service, you can ignore this email.
    </p>
    <div class="footer">
      <p>Company Name | Address | Phone</p>
    </div>
  </div>
</body>
</html>
`;
};

export const driverEmailConfirmationTemplate = (token: string) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f4f4;
    }

    .container {
      max-width: 600px;
      margin: 50px auto;
      background-color: #ffffff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    }

    h2 {
      color: #333333;
    }

    p {
      color: #555555;
    }

    .verification-link {
      display: inline-block;
      padding: 10px 20px;
      background-color: #007BFF;
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
    }

    .footer {
      margin-top: 20px;
      text-align: center;
      color: #888888;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Email Verification</h2>
    <p>
      Thank you for signing up! To complete your registration, please click the following link to verify your email address:
    </p>
    <p>
      <a href="${process.env.BASEURL}/v1/auth/verify/driver-email/${token}" class="verification-link">Verify Email</a>
    </p>
    <p>
      If you did not sign up for this service, you can ignore this email.
    </p>
    <div class="footer">
      <p>Company Name | Address | Phone</p>
    </div>
  </div>
</body>
</html>
`;
};
