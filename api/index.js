const fs = require('fs');
const path = require('path');

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const filePath = path.join(__dirname, 'users.json');
  let users = [];
  try {
    users = JSON.parse(fs.readFileSync(filePath, 'utf8') || '[]');
  } catch(e) { users = []; }

  if (req.method === 'GET') {
    return res.status(200).json(users);
  }
  if (req.method === 'POST') {
    const newUser = req.body;
    newUser.id = Date.now();
    users.push(newUser);
    return res.status(201).json(newUser);
  }
  return res.status(200).json({ status: 'API INOR-CHEN AKTIF BOS!' });
};
