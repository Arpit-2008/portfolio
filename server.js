const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


// MongoDB connection
mongoose.connect(process.env.MONGO_URI,{
useNewUrlParser:true,
useUnifiedTopology:true
})
.then(()=>console.log("Database connected"))
.catch(err=>console.log("DB Error:",err));



/* =========================
   DEVICE SCHEMA
========================= */

const deviceSchema = new mongoose.Schema({

deviceId:String,
deviceName:String,
owner:String,
status:{type:String, default:"active"},
createdAt:{type:Date, default:Date.now}

});

const Device = mongoose.model("Device",deviceSchema);



/* =========================
   LOCATION SCHEMA
========================= */

const locationSchema = new mongoose.Schema({

deviceId:String,
latitude:Number,
longitude:Number,
timestamp:{type:Date, default:Date.now}

});

const Location = mongoose.model("Location",locationSchema);



/* =========================
   SOCKET CONNECTION
========================= */

io.on("connection",(socket)=>{
console.log("Client connected:",socket.id);
});



/* =========================
   DEVICE REGISTER
========================= */

app.post("/device/register", async(req,res)=>{

const {deviceId,deviceName,owner} = req.body;

try{

const device = new Device({
deviceId,
deviceName,
owner
});

await device.save();

res.send({success:true});

}catch(err){

res.status(500).send({error:"Device register error"});

}

});



/* =========================
   DEVICE LIST
========================= */

app.get("/devices", async(req,res)=>{

try{

const devices = await Device.find();

res.send(devices);

}catch(err){

res.status(500).send({error:"Device fetch error"});

}

});



/* =========================
   LOCATION RECEIVE
========================= */

app.post("/location", async(req,res)=>{

const {deviceId,latitude,longitude} = req.body;

if(!deviceId || latitude===undefined || longitude===undefined){
return res.status(400).send({error:"Invalid data"});
}

try{

// check device exists
const device = await Device.findOne({deviceId});

if(!device){
return res.status(404).send({error:"Device not registered"});
}


// save location
const loc = new Location({
deviceId,
latitude,
longitude
});

await loc.save();


// realtime broadcast
io.emit("locationUpdate",{
deviceId,
latitude,
longitude
});

res.send({success:true});

}catch(err){

res.status(500).send({error:"DB save error"});

}

});



/* =========================
   LAST LOCATIONS
========================= */

app.get("/locations", async(req,res)=>{

try{

const devices = await Location.aggregate([

{ $sort:{timestamp:-1} },

{ $group:{
_id:"$deviceId",
deviceId:{ $first:"$deviceId" },
latitude:{ $first:"$latitude" },
longitude:{ $first:"$longitude" },
timestamp:{ $first:"$timestamp" }

}}

]);

res.send(devices);

}catch(err){

res.status(500).send({error:"DB fetch error"});

}

});



/* =========================
   HOME PAGE
========================= */

app.get("/",(req,res)=>{
res.sendFile(path.join(__dirname,"public/index.html"));
});



/* =========================
   SERVER START
========================= */

const PORT = process.env.PORT || 3000;

server.listen(PORT,()=>{
console.log("Server running on port",PORT);
});