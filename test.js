const { connectDB } = require('./src/config/database');
const Customer = require('./src/modules/customer/customer.model');

async function test() {
  await connectDB();
  try {
    const customer = await Customer.create({
      email: 'test@example.com',
      mobile: '9999999999',
      password_hash: 'hash',
      full_name: 'Test Name',
      full_address: '123 Test St',
      pincode: '123456',
      state_name: 'Telangana',
      is_mobile_verified: false
    });
    console.log("Success:", customer.id);
  } catch (err) {
    console.error("Error creating customer:", err);
  }
  process.exit(0);
}
test();
