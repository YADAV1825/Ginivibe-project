import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key';
const token = jwt.sign({ id: '123', username: 'test' }, JWT_SECRET, { expiresIn: '7d' });
console.log('Signed token:', token);
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('Verified:', decoded);
} catch (e) {
  console.error('Error:', e);
}
