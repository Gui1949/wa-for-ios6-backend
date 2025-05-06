const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const QRCode = require('qrcode');

const app = express();
const client = new Client();

// Variable to store the QR code
let qrCodeData = null;

// WhatsApp authentication
client.on('qr', (qr) => {
    // Clear terminal before showing QR
    console.clear();
    console.log('Scan the QR code below to authenticate:');
    console.log('\n');
    qrcode.generate(qr, { small: true });
    console.log('\n');
    console.log('Waiting for scan...');
    
    // Store QR code data for the endpoint
    qrCodeData = qr;
});

client.on('ready', () => {
    console.log('WhatsApp client is ready!');
});

// Initialize WhatsApp client
client.initialize();

// Route to get QR code
app.get('/qr-code', async (req, res) => {
    if (qrCodeData) {
        try {
            // Set the content type to image/png
            res.setHeader('Content-Type', 'image/png');
            
            // Generate QR code image and pipe it directly to the response
            QRCode.toFileStream(res, qrCodeData);
        } catch (error) {
            console.error('Error generating QR code image:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to generate QR code image'
            });
        }
    } else {
        res.status(404).json({
            success: false,
            error: 'QR code not available yet. Please try again later.'
        });
    }
});

// Route to get all contacts
app.get('/contacts', async (req, res) => {
    try {
        const contacts = await client.getContacts();
        res.json({
            success: true,
            contacts: contacts.map(contact => ({
                id: contact.id._serialized,
                name: contact.name || contact.pushname || 'Unknown',
                number: contact.number
            }))
        });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
});

// Route to get chat messages
app.get('/messages', async (req, res) => {
    try {
        let chats = await client.getChats();
        const messages = [];

        chats = chats.slice(0, 10);

        for (const chat of chats) {
            let chatMessages = await chat.fetchMessages({ limit: 10 });
            messages.push({
                chatId: chat.id._serialized,
                contact: chat.name || chat.pushname || 'Unknown',
                messages: chatMessages.map(msg => ({
                    id: msg.id._serialized,
                    content: msg.body,
                    timestamp: msg.timestamp,
                    fromMe: msg.fromMe,
                    type: msg.type
                }))
            });
        }

        res.json({
            success: true,
            messages
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Endpoint to send message
app.get('/send-message', async (req, res) => {
    try {
        const { message, number } = req.query;
        
        if (!message || !number) {
            return res.status(400).json({ error: 'Message and number are required' });
        }

        // Format the number (add country code if not present)
        const formattedNumber = number

        // Send message
        await client.sendMessage(formattedNumber, message);
        
        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});