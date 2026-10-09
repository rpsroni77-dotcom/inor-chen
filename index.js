const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();
app.use(cors({origin:'*'}));
app.use(express.json());
const DB='./users.json';
if(!fs.existsSync(DB)) fs.writeFileSync(DB,'[]');
const load=()=>{try{return JSON.parse(fs.readFileSync(DB,'utf8')||'[]')}catch{return []}}
const save=(d)=>fs.writeFileSync(DB,JSON.stringify(d,null,2));
const now=()=>new Date().toLocaleString('id-ID');
const getDomain=(req)=>{if(req) return `${req.protocol}://${req.get('host')}`; return "https://inorchen77b.loca.lt";}

app.get('/',(req,res)=>{
  res.json({
    status:"INORCHEN77 ONLINE BOS!",
    domain:getDomain(req),
    total_user:load().length,
    mailbox1:getDomain(req)+"/api/mailbox1",
    mailbox2:getDomain(req)+"/api/mailbox2",
    endpoints:[
      "POST /register","POST /login","POST /sync","GET /api/",
      "POST /api/deposit","POST /api/withdraw & /api/whitdraw",
      "GET /api/balance/:username","GET /api/record/:username",
      "POST /api/change-password","GET /api/user",
      "GET /api/data/user/:username","POST /api/transiver",
      "PUT /api/edit/:username","PATCH /api/update/:username",
      "GET /api/mailbox1","GET /api/mailbox2"
    ]
  });
});

app.post(['/register','/api/register','/sync','/api/sync'],(req,res)=>{
  let users=load(); let {username,password,saldo,balance}=req.body;
  if(!username||!password) return res.json({success:false,msg:"wajib"});
  if(users.find(u=>u.username==username)) return res.json({success:false,msg:"sudah ada"});
  let u={username,password,balance:parseInt(balance||saldo||0),saldo:parseInt(saldo||balance||0),kredit:parseInt(balance||saldo||0),deposit:0,whitdraw:0,withdraw:0,transaksi:[],status_transaksi:"active",created_at:now()};
  users.push(u); save(users); res.json({success:true,data:u});
});
app.post(['/login','/api/login'],(req,res)=>{
  let users=load(); let f=users.find(x=>x.username==req.body.username&&x.password==req.body.password);
  if(f) res.json({status:"sukses login",success:true,DATA_USER:f});
  else res.json({status:"gagal",success:false});
});
app.post(['/api/deposit','/deposit'],(req,res)=>{
  let users=load(); let {username,amount}=req.body; let amt=parseInt(amount||0);
  let i=users.findIndex(u=>u.username==username); if(i==-1) return res.json({success:false});
  users[i].balance+=amt; users[i].saldo+=amt; users[i].kredit+=amt; users[i].deposit+=amt;
  let trx={id:Date.now(),type:"DEPOSIT",amount:amt,balance:users[i].balance,date:now()};
  users[i].transaksi.push(trx); save(users); res.json({success:true,BALANCE:users[i].balance,RECORD:trx});
});
function wd(req,res){
  let users=load(); let {username,amount}=req.body; let amt=parseInt(amount||0);
  let i=users.findIndex(u=>u.username==username); if(i==-1) return res.json({success:false});
  if(users[i].balance<amt) return res.json({success:false,msg:"saldo kurang",BALANCE:users[i].balance});
  users[i].balance-=amt; users[i].saldo-=amt; users[i].kredit-=amt; users[i].whitdraw+=amt;
  let trx={id:Date.now(),type:"WITHDRAW",amount:amt,balance:users[i].balance,date:now()};
  users[i].transaksi.push(trx); save(users); res.json({success:true,BALANCE:users[i].balance,RECORD:trx});
}
app.post(['/api/withdraw','/api/whitdraw','/withdraw','/whitdraw'],wd);
app.get(['/api/balance/:username','/api/kredit/:username'],(req,res)=>{
  let u=load().find(x=>x.username==req.params.username); if(!u) return res.json({success:false});
  res.json({success:true,BALANCE:u.balance,KREDIT:u.kredit,SALDO:u.saldo,DATA_USER:u});
});
app.get('/api/record/:username',(req,res)=>{
  let u=load().find(x=>x.username==req.params.username); if(!u) return res.json({success:false});
  res.json({success:true,BALANCE:u.balance,RECORD:u.transaksi});
});
app.post('/api/change-password',(req,res)=>{
  let users=load(); let {username,oldPassword,newPassword}=req.body;
  let i=users.findIndex(u=>u.username==username); if(i==-1) return res.json({success:false});
  if(users[i].password!=oldPassword) return res.json({success:false,msg:"old salah"});
  users[i].password=newPassword; save(users); res.json({success:true});
});
app.get('/api/user',(req,res)=>{res.json(load());});
app.get('/api/data/user/:username',(req,res)=>{
  let u=load().find(x=>x.username==req.params.username); if(!u) return res.json({success:false});
  res.json({success:true,DATA_USER:u});
});
app.post('/api/transiver',(req,res)=>{
  let users=load(); let {from,to,amount}=req.body; let jml=parseInt(amount||0);
  let iF=users.findIndex(u=>u.username==from); let iT=users.findIndex(u=>u.username==to);
  if(iF==-1||iT==-1) return res.json({success:false}); if(users[iF].balance<jml) return res.json({success:false,msg:"kurang"});
  users[iF].balance-=jml; users[iF].saldo-=jml; users[iF].kredit-=jml; users[iT].balance+=jml; users[iT].saldo+=jml; users[iT].kredit+=jml;
  users[iF].transaksi.push({id:Date.now(),type:"TRANSIVER_OUT",amount:jml,to,from,date:now()});
  users[iT].transaksi.push({id:Date.now()+1,type:"TRANSIVER_IN",amount:jml,from,to,date:now()});
  save(users); res.json({success:true});
});
app.put('/api/edit/:username',(req,res)=>{
  let users=load(); let i=users.findIndex(u=>u.username==req.params.username); if(i==-1) return res.json({success:false});
  Object.keys(req.body).forEach(k=>users[i][k]=req.body[k]); save(users); res.json({success:true,DATA_USER:users[i]});
});
app.patch('/api/update/:username',(req,res)=>{
  let users=load(); let i=users.findIndex(u=>u.username==req.params.username); if(i==-1) return res.json({success:false});
  Object.keys(req.body).forEach(k=>users[i][k]=req.body[k]); save(users); res.json({success:true,DATA_USER:users[i]});
});
app.get(['/api/mailbox1','/mailbox1'],(req,res)=>{
  let users=load(); res.json({success:true,mailbox:"MAILBOX 1",total_user:users.length,DATA_USER_ALL:users});
});
app.get(['/api/mailbox2','/mailbox2'],(req,res)=>{
  let users=load(); let all=[]; users.forEach(u=>u.transaksi.forEach(t=>all.push({username:u.username,...t}))); all.sort((a,b)=>b.id-a.id);
  res.json({success:true,mailbox:"MAILBOX 2",total_transaksi:all.length,RECORD_ALL:all});
});
app.listen(3000,'0.0.0.0',()=>console.log('API INORCHEN77 ONLINE BOS!'));
