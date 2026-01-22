import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import otpGenerator from "otp-generator";
import dotenv from "dotenv";
import twilio from "twilio";
import otp from "../models/otp.model.js"
import penddinguser from '../models/panddinguserschema.js';

dotenv.config();

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  if (
    email === process.env.ADMIN_ID &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign({ email, role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    return res.json({ token });
  }
  return res.status(401).json({ message: "Invalid credentials" });
};

const validatePhoneNumber = (phone, countryCode) => {
  try {
    const phoneNumber = parsePhoneNumberFromString(phone, countryCode);
    return phoneNumber ? phoneNumber.isValid() : false;
  } catch (error) {
    return false;
  }
};

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// const sendOtp = async (contactNumber) => {
//   const otp = otpGenerator.generate(6, {
//     upperCase: false,
//     specialChars: false,
//   });
//   console.log(`Sending OTP ${otp} to ${contactNumber}`);

//   await client.messages.create({
//     body: `Your OTP is ${otp}`,
//     from: process.env.TWILIO_PHONE_NUMBER,
//     to: contactNumber,
//   });
// };

// export const userSignup = async (req, res) => {
//   try {
//     const { name, contactNumber, password } = req.body;

//     if (!contactNumber || !password || !name)
//       return res.status(400).json({
//         message: "all fields are required",
//       });

//     if (!validatePhoneNumber(contactNumber, "IN")) {
//       return res.status(400).json({
//         message:
//           "Invalid Indian phone number format. Please provide a 10-digit number.",
//       });
//     }

//     const existingUser = await User.findOne({ contactNumber });
//     if (existingUser) {
//       return res
//         .status(409)
//         .json({ message: "A user with this phone number already exists." });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     // console.log(hashedPassword);


//     const newUser = await User.create({
//       name,
//       contactNumber,
//       hashedPassword,
//     });

//     const token = jwt.sign(
//       {
//         id: newUser._id,
//         contactNumber: newUser.contactNumber,
//         role: "user",
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     res.status(201).json({
//       message: "User registered successfully!",
//       token,
//       user: {
//         id: newUser._id,
//         contactNumber: newUser.contactNumber,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "error registering user",
//       error,
//     });
//     console.log("Signup error:", error.message);
//   }
// };

// const sendOtp = async (contactNumber) => {
//   const generatedOtp = otpGenerator.generate(6, {
//     upperCase: false,
//     specialChars: false,
//   });

//   await Otp.deleteMany({ contactNumber });

//   await Otp.create({
//     contactNumber,
//     otp: generatedOtp,
//   });

//   await client.messages.create({
//     body: `Your OTP is ${generatedOtp}`,
//     from: process.env.TWILIO_PHONE_NUMBER,
//     to: contactNumber,
//   });
// };
export const userSignup = async (req, res) => {
  try {
    const { name, password, email } = req.body;
    const contactNumber = Number(req.body.contactNumber);

    if (!name || !password || !contactNumber || !email) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (isNaN(contactNumber)) {
      return res.status(400).json({ message: "Invalid mobile number" });
    }

    if (!validatePhoneNumber(String(contactNumber), "IN")) {
      return res.status(400).json({ message: "Invalid Indian mobile number" });
    }

    if (!email) {
      return res.status(400).json({ message: "Email not found" });

    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    // const verifyOtp = await sendOtp(contactNumber);
    // const { otp } = req.body;
    // if (!otp) {
    //   return res.status(400).json({ message: "OTP is required" });
    // }

    // if (otp !== verifyOtp) {
    //   return res.status(400).json({ message: "Invalid OTP" });
    // }


    const existingUser = await User.findOne({ contactNumber });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      contactNumber,
      hashedPassword,
      email
    });

    res.status(201).json({ message: "User registered", userId: user._id });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// export const userSignup = async (req, res) => {
//   try {
//     const { name, email, password, contactNumber } = req.body;

//     if (!name || !email || !password || !contactNumber) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     if (!validatePhoneNumber(contactNumber, "IN")) {
//       return res.status(400).json({ message: "Invalid Indian mobile number" });
//     }

//     const userExists = await User.findOne({ contactNumber });
//     if (userExists) {
//       return res.status(409).json({ message: "User already exists" });
//     }

//     await penddinguser.deleteMany({ contactNumber });

//     await penddinguser.create({
//       name,
//       email,
//       password, // temporary
//       contactNumber,
//     });

//     await client.verify.v2
//       .services(process.env.TWILIO_VERIFY_SERVICE_SID)
//       .verifications.create({
//         to: `+91${contactNumber}`,
//         channel: "sms",
//       });

//     res.status(200).json({ message: "OTP sent successfully" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };



// export const verifyOtpAndRegister = async (req, res) => {
//   try {
//     const { contactNumber, otp } = req.body;

//     if (!contactNumber || !otp) {
//       return res.status(400).json({ message: "OTP and contact number required" });
//     }

//     const verification = await client.verify.v2
//       .services(process.env.TWILIO_VERIFY_SERVICE_SID)
//       .verificationChecks.create({
//         to: `+91${contactNumber}`,
//         code: otp,
//       });

//     if (verification.status !== "approved") {
//       return res.status(400).json({ message: "Invalid or expired OTP" });
//     }

//     const pendingUser = await penddinguser.findOne({ contactNumber });
//     if (!pendingUser) {
//       return res.status(400).json({ message: "Signup data not found" });
//     }

//     const hashedPassword = await bcrypt.hash(pendingUser.password, 10);

//     const user = await User.create({
//       name: pendingUser.name,
//       email: pendingUser.email,
//       contactNumber,
//       hashedPassword,
//     });

//     await pendingUser.deleteOne({ contactNumber });

//     const token = jwt.sign(
//       { id: user._id, role: "user" },
//       process.env.JWT_SECRET,
//       { expiresIn: "7d" }
//     );

//     res.status(201).json({
//       message: "User registered successfully",
//       token,
//       userId: user._id,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


export const userLogin = async (req, res) => {
  try {
    const { contactNumber, password } = req.body;

    if (!contactNumber || !password) {
      return res
        .status(400)
        .json({ message: "Contact number and password are required" });
    }

    const user = await User.findOne({ contactNumber });
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found. Please sign up first." });
    }

    console.log(User.hashedPassword);


    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      {
        id: user._id,
        contactNumber: user.contactNumber,
        role: "Seller",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user._id,
        contactNumber: user.contactNumber,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      message: "Error logging in user",
      error,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { contactNumber } = req.body;

    if (!contactNumber) {
      return res.status(400).json({ message: "Contact number is required" });
    }

    if (!validatePhoneNumber(contactNumber, "IN")) {
      return res.status(400).json({
        message:
          "Invalid Indian phone number format. Please provide a 10-digit number.",
      });
    }

    const verifyOtp = await sendOtp(contactNumber);
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    if (otp !== verifyOtp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    const newPassword = req.body.newPassword;
    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error.message);
    res.status(500).json({
      message: "Error resetting password",
      error,
    });
  }
};

export const userLogout = async (req, res) => {
  try {
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax'
    });

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    res.status(500).json({ message: "Error logging out", error });

  }
}

export const testRoute = async (req, res) => {
  try {
    // Log the incoming data to your server's console for debugging
    console.log('Request body received:', req.body);

    // Send a success response back to the frontend
    res.status(200).json({
      message: 'Data received successfully',
      data: req.body // It's helpful to send the data back for confirmation
    });

  } catch (error) {
    // Basic error handling
    console.error('Error in testRoute:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};