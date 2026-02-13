import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendOtpSMS = async (mobile, otp) => {
  try {
    const message = await client.messages.create({
      body: `Your OTP is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER, // ✅ correct
      to: `+91${mobile}`,
    });

    console.log("SMS sent:", message.sid);
  } catch (error) {
    console.log("Twilio SMS error:", error.message);
  }
};
