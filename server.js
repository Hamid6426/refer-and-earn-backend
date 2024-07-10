const express = require('express');
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const app = express();
const PORT = process.env.PORT || 5000;

const prisma = new PrismaClient();

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Good! The server is running! Welcome to the Refer and Earn API');
});

app.post('/api/referrals', async (req, res) => {
  try {
    const { referrerName, referrerEmail, refereeName, refereeEmail } = req.body;

    // Validate data
    if (!referrerName || !referrerEmail || !refereeName || !refereeEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Save referral to database using Prisma
    const referral = await prisma.referral.create({
      data: {
        referrerName,
        referrerEmail,
        refereeName,
        refereeEmail,
      },
    });

    // Send email notification to referrer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const mailOptionsReferrer = {
      from: process.env.GMAIL_USER,
      to: referrerEmail,
      subject: 'Referral Confirmation',
      text: `Hi ${referrerName},\n\nYou have successfully referred ${refereeName}. Thank you for the referral!`,
    };

    transporter.sendMail(mailOptionsReferrer, (error, info) => {
      if (error) {
        console.error('Error sending email to referrer:', error);
        return res.status(500).json({ error: 'Failed to send email to referrer' });
      }
      console.log('Email sent to referrer:', info.response);
    });

    // Send email notification to referee
    const mailOptionsReferee = {
      from: process.env.GMAIL_USER,
      to: refereeEmail,
      subject: 'Referral Notification',
      text: `Hi ${refereeName},\n\n${referrerName} has referred you. Welcome!`,
    };

    transporter.sendMail(mailOptionsReferee, (error, info) => {
      if (error) {
        console.error('Error sending email to referee:', error);
        return res.status(500).json({ error: 'Failed to send email to referee' });
      }
      console.log('Email sent to referee:', info.response);
    });

    res.status(201).json(referral);
  } catch (error) {
    console.error('Error processing referral:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
