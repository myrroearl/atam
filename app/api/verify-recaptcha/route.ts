import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: "reCAPTCHA token is required" }, { status: 400 })
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY
    if (!secretKey) {
      console.error("RECAPTCHA_SECRET_KEY is not configured")
      return NextResponse.json({ error: "reCAPTCHA not configured" }, { status: 500 })
    }

    // Verify the reCAPTCHA token with Google
    const verificationUrl = 'https://www.google.com/recaptcha/api/siteverify'
    const verificationResponse = await fetch(verificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    })

    const verificationResult = await verificationResponse.json()

    if (!verificationResult.success) {
      console.error("reCAPTCHA verification failed:", verificationResult['error-codes'])
      return NextResponse.json({ 
        error: "reCAPTCHA verification failed",
        details: verificationResult['error-codes']
      }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("reCAPTCHA verification error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
