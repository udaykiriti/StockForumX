import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    let transporter;

    if (process.env.SMTP_HOST) {
        // Production / Configured SMTP
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    } else {
        // Development / Ethereal
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
        console.log('Ethereal Email Configured');
    }

    const message = {
        from: `${process.env.FROM_NAME || 'StockForumX'} <${process.env.FROM_EMAIL || 'noreply@stockforumx.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html
    };

    try {
        const info = await transporter.sendMail(message);
        console.log('Message sent: %s', info.messageId);

        if (!process.env.SMTP_HOST && process.env.NODE_ENV !== 'production') {
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        }
    } catch (error) {
        console.error('SMTP Send Failed:', error.message);

        // Fallback to Ethereal in Development
        if (process.env.NODE_ENV === 'development' && process.env.SMTP_HOST) {
            console.log(' Authentication failed. Falling back to Ethereal Email...');
            const testAccount = await nodemailer.createTestAccount();
            const devTransporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                }
            });

            const info = await devTransporter.sendMail(message);
            console.log('Fallback Email Sent: %s', info.messageId);
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        } else {
            throw error;
        }
    }
};

export default sendEmail;
