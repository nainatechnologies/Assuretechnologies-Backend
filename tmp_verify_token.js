const { verifyToken } = require('./src/utils/jwt');
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA1ZTVhMmQ0LTQzOGYtNDMzOS1hNjhkLTUyMjBjODdlNTg0YyIsInJvbGUiOiJjdXN0b21lciIsImlhdCI6MTc4NzY3MzE3MCwiZXhwIjoxNzg4Mjc3OTcwfQ.0-hA-0Os6OsExFst1gY9EAJsk3Luq1jPs2MtFxF7_EY';
try {
  const decoded = verifyToken(token);
  console.log('OK', decoded);
} catch (e) {
  console.error('ERR', e.message);
}
