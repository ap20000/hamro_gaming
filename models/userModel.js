import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
    type: String,
    minlength: 6,
    required: function() {
      return !this.fromGoogle;  // password required only if not from Google
    },
  },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    otp: String,
    otpExpiry: Date,
    isVerified: {
      type: Boolean,
      default: false,
    },
    fromGoogle: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Password hashing
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.fromGoogle) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
