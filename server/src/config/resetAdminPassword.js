import bcrypt from 'bcryptjs';
import User from '../models/User.js';

// Explicit recovery only: normal startup must preserve account passwords.
export async function resetAdminPassword(env = process.env) {
  if (env.RESET_ADMIN_PASSWORD !== 'true') return;
  const email = env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 8) {
    throw new Error('Admin reset requires ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters).');
  }
  const user = await User.findOne({ email, role: 'admin' }).select('+passwordHash');
  if (!user) throw new Error('Admin reset: no matching admin account. Check ADMIN_EMAIL and MONGO_URI.');
  if (await bcrypt.compare(password, user.passwordHash)) {
    console.log('Admin password already matches. Remove RESET_ADMIN_PASSWORD from the environment.');
    return;
  }
  const now = new Date();
  await User.updateOne({ _id: user._id, role: 'admin' }, {
    $set: { passwordHash: await bcrypt.hash(password, 12), passwordChangedAt: now },
    $inc: { sessionVersion: 1 },
    $unset: { resetHash: 1, resetExpires: 1 },
    $push: { accountEvents: { $each: [{ type: 'password_reset_by_admin', at: now }], $slice: -20 } }
  });
  console.log('Admin password reset successfully. Remove RESET_ADMIN_PASSWORD from the environment.');
}
