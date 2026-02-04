import twilio from "twilio";

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

export const sendOtpSMS = async (mobile, otp) => {
  await client.messages.create({
    body: `Your OTP is ${otp}`,
    from: process.env.TWILIO_VERIFY_SERVICE_SID,  
    to: `+91${mobile}`,  
  });
};
