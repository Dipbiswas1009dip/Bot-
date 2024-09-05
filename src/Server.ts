const express = require('express');
const QRCode = require('qrcode');
const { Boom } = require("@hapi/boom");
const makeWASocket = require("@whiskeysockets/baileys").default;
const {
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} = require("@whiskeysockets/baileys");

const app = express();
const port = 3000;
let qrCodeData = ''; // QR কোড ডেটা সংরক্ষণ করার জন্য

// Express route to show QR code in the browser
app.get('/', (req, res) => {
  if (qrCodeData) {
    QRCode.toDataURL(qrCodeData, (err, url) => {
      if (err) {
        res.send('Error generating QR code');
      } else {
        res.send(`<img src="${url}">`);
      }
    });
  } else {
    res.send('No QR code available');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Start WhatsApp connection
const startSock = async () => {
  const { state, saveCreds } = await useMultiFileAuthState("baileys_auth_info");
  const { version } = await fetchLatestBaileysVersion();
  
  const sock = makeWASocket({
    version,
    printQRInTerminal: false, // Disable terminal QR code display
    auth: state,
  });

  sock.ev.on('connection.update', (update) => {
    const { qr, connection } = update;
    
    if (qr) {
      // When QR code is received, save it for the web page
      qrCodeData = qr;
      console.log('QR code received, visit http://localhost:3000 to scan');
    }

    if (connection === 'open') {
      console.log('WhatsApp connection opened');
    }
  });

  sock.ev.on('creds.update', saveCreds);
};

startSock();
