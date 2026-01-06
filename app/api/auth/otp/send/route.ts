import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { sendEmail, generateOTP, createOTPEmailTemplate } from '@/lib/email';

// OTP expiry time (10 minutes)
const OTP_EXPIRY_MINUTES = 10;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate input
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Check if user exists (but don't require it)
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    // Generate OTP
    const otp = generateOTP(6);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Delete any existing OTP for this email
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: email,
      },
    });

    // Store OTP in database
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: otp,
        expires: expiresAt,
      },
    });

    // Send OTP email with appropriate message
    const isNewUser = !user;
    const { html, text } = createOTPEmailTemplate(
      otp,
      user?.name || undefined,
      isNewUser
    );

    await sendEmail(email, 'Your Blog Bowl Login Code', html, text);

    return NextResponse.json(
      {
        message: 'OTP sent successfully',
        expiresIn: OTP_EXPIRY_MINUTES * 60, // in seconds
        isNewUser, // Let frontend know if this is a new user
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to send OTP. Please try again.' },
      { status: 500 }
    );
  }
}
