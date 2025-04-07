

const SendOtp = async (props) => {
    const options = {
        method: 'POST',
        headers: {
            clientId: process.env.clientId,
            clientSecret: process.env.clientSecret,
            'Content-Type': 'application/json'
        },
        body: `{"phoneNumber":"${props?.phoneno}","expiry":900,"otpLength":6,"channels":["SMS"]}`
    };
    try {
        const response = await fetch('https://auth.otpless.app/auth/v1/initiate/otp', options)
        if (!response.ok) {
            return { status: 'error', message: 'Failed To Send SMS' }
        }
        const result = await response.json();

        if (result?.requestId) {
            return { status: 'success', requestId: result?.requestId }
        } else {
            return { status: 'error', message: 'Failed To Send Message!' }

        }
    } catch (error) {
        return { status: 'error', message: `Failed To Send SMS ${error.message}` }
    }
}




const VerifyOtp = async (props) => {    
    const options = {
        method: 'POST',
        headers: {
            clientId: process.env.clientId,
            clientSecret: process.env.clientSecret,
            'Content-Type': 'application/json'
        },
        body: `{"requestId":"${props?.requestId}","otp":"${props?.otp}"}`
    };

    try {
        const response = await fetch('https://auth.otpless.app/auth/v1/verify/otp', options)
       
        if (!response.ok) {
            return { status: 'error', message: 'Failed To Verify Otp' }
        }
        const result = await response.json();        

        if (result?.isOTPVerified) {
            return { status: 'success' }
        } else {
            return { status: 'error', message: 'Failed To Verify Otp!' }

        }
    } catch (error) {
        return { status: 'error', message: `Failed To Veify OTP ${error.message}` }
    }
}




module.exports = { VerifyOtp, SendOtp }