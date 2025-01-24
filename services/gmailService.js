const nodemailer = require('nodemailer');
const fs = require('fs');

// Create a reusable transporter object using Gmail's SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'bhuvinode@gmail.com', // replace with your Gmail account
        pass: 'iktl hzvu gqre fxrh',  // replace with your Gmail password or app-specific password
    }
});

const sendInvoiceByEmail = async (customerEmail, filePath) => {
    try {
        const mailOptions = {
            from: 'gokulamTravels@gmail.com',
            to: customerEmail,
            subject: 'Your Travel Invoice',
            text: 'Dear Customer, \n\nPlease find attached your invoice for the completed trip.\n\nThank you for choosing our service!',
            attachments: [
                {
                    filename: 'invoice.pdf',
                    path: filePath ,
                    contentType: 'application/pdf' // attach the generated PDF invoice
                }
            ]
        };

        // Send email with the attached PDF
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = {sendInvoiceByEmail}