const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Places = require('./models/Places');
const Booking = require('./models/Booking');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const imageDownloader = require('image-downloader');
const multer = require('multer');
const { DEFAULT_CIPHERS } = require('tls');
const { rejects } = require('assert');
const { resolve } = require('path');

require('dotenv').config();

const app = express();
const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = "abhay";
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cookieParser());
app.use('/uploads',express.static(__dirname + '/uploads'));


app.use(cors({
    credentials: true,
    origin: 'http://localhost:5173',
  }));

mongoose.connect(process.env.MONGO_URL, 
    {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}
)
.then(() => {
    console.log('MongoDB connected successfully');
})
.catch(err => {
    console.error('MongoDB connection error:', err);
});

function getUserDataFromReq(req){
    return new Promise((resolve,reject)=>{
        jwt.verify(req.cookies.token, jwtSecret, {}, async(err, userData) => {
        if(err) throw err;
        resolve(userData);
        });
    })
}

app.get('/test', (req, res) => {
    res.json('test ok');
});

app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userDoc = await User.create({
            name,
            email,
            password:bcrypt.hashSync(password, bcryptSalt),
        });
        res.json(userDoc);
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(422).json({ error: 'Internal server error' });
    }
});

app.post('/login',async (req,res) =>{
    const {email,password} = req.body;
    const userDoc = await User.findOne({email});
    if(userDoc){
        const passOk = bcrypt.compareSync(password,userDoc.password)
        if(passOk){
            jwt.sign({
                email:userDoc.email,
                id:userDoc._id,
               
              }, jwtSecret, {}, (err,token) => {
                if (err) throw err;
                res.cookie('token', token).json(userDoc);
              });
        }else{
            res.status(422).json('pass no ok');
        }
    }else{
        res.json('not found');
    }
});

app.get('/profile',(req,res) =>{
    const {token} = req.cookies;
    if(token){
        jwt.verify(token,jwtSecret,{}, async(err,userData) =>{
            if(err) throw err;
          const {name,email,_id} =  await User.findById(userData.id);
            res.json({name,email,_id});
        });
    }
    else{
        res.json(null);
    }
});

app.post('/logout',(req,res) =>{

    res.cookie('token', '').json(true);
});


app.post('/upload-by-link', async(req,res)=>{
    const { link } = req.body;
  const newName = 'photo' + Date.now() + '.jpg';
await imageDownloader.image({
    url: link,
    dest:__dirname + '/uploads/' + newName,
});
res.json(newName);
   
})

const photosMiddleware = multer({dest:'uploads/'});
app.post('/upload',photosMiddleware.array('photos',100) , (req,res) =>{
    const uploadedFiles = [];
   for (let i =0; i<req.files.length;i++){
    const {path,originalname} = req.files[i];
     const parts = originalname.split('.');
     const ext = parts[parts.length -1];
     const newPath = path + '.'+ ext;
    fs.renameSync(path,newPath);
    uploadedFiles.push(newPath.replace(/uploads[\\/]/, ''));
    }
  res.json(uploadedFiles);
})

app.post('/places', (req,res)=>{
    const {token} = req.cookies;
    const {title,address,addPhotos,description,perks,checkIn,checkOut,maxGuests,price,} = req.body;
    jwt.verify(token,jwtSecret,{}, async(err,userData) =>{
        if(err) throw err;
        const placeDoc = await Places.create({
            owner: userData.id,
            title, address, photos: addPhotos, description, perks, checkIn, checkOut, maxGuests, price,
        });
        res.json(placeDoc);
    });
});

app.get('/user-places',(req,res) =>{
    const {token} = req.cookies;
    jwt.verify(token,jwtSecret,{}, async (err,userData) =>{const {id} = userData;
    res.json( await Places.find({owner:id}));
}); 
})

app.get('/places/:id', async (req,res) =>{
    const {id} = req.params;
    res.json(await Places.findById(id));
})

 app.put('/places' , async(req,res)=>{
    const {token} = req.cookies;
    const {
      id, title,address,addPhotos,description,
      perks,extraInfo,checkIn,checkOut,maxGuests,price,
    } = req.body;
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      const placeDoc = await Places.findById(id);
      if (userData.id === placeDoc.owner.toString()) {
        placeDoc.set({
          title,address,photos:addPhotos,description,
          perks,extraInfo,checkIn,checkOut,maxGuests,price,
        });
        await placeDoc.save();
        res.json('ok');
      }
    });
 });

 app.get('/places', async(req,res) =>{
    res.json( await Places.find());
 })

 app.post('/bookings' , async(req,res) =>{
    const userData = await getUserDataFromReq(req);
  const {place,checkIn,checkOut,Guest,name,phone,price} = req.body;
  Booking.create({
    place,checkIn,checkOut,Guest,name,phone,price,
    user:userData.id,
  }).then((doc) =>{
    res.json(doc);
  }).catch((err) =>{
    throw err;
  })
 });

 app.get('/bookings',async(req,res) =>{
    const userData = await getUserDataFromReq(req);
    res.json( await Booking.find({user:userData.id}).populate('place'))
})


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);

});





