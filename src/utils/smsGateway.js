const axios = require('axios'); // Note: ensure axios is installed or use fetch

/**
 * Sends an OTP via SpearUC SMS Gateway
 * @param {string} mobileNo - The recipient's mobile number (comma-separated if multiple)
 * @param {string} otp - The generated OTP
 * @returns {Promise<object>} API response
 */
const sendRegistrationOTP = async (mobileNo, otp) => {
  try {
    const baseUrl = process.env.SMS_API_URL;
    const authKey = process.env.SMS_AUTH_KEY;
    const sender = process.env.SMS_SENDER_ID;
    const t_id = process.env.SMS_TEMPLATE_ID;
    
    // Format the SMS text
    const smsText = `Dear Customer , your Registration OTP is ${otp} for True Mentor Login -Support Team RisiEdu`;
    
    // Construct the query parameters
    const params = new URLSearchParams({
      type: 'smsquicksend',
      authKey: authKey,
      sender: sender,
      to_mobileno: mobileNo,
      sms_text: smsText,
      t_id: t_id
    });

    const url = `${baseUrl}?${params.toString()}`;

    // Make the GET request to the SMS Gateway
    const response = await axios.get(url);
    
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error sending SMS:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendRegistrationOTP
};
