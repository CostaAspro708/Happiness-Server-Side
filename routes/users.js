var express = require('express');
var router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const secretKey = "secret key";

/* GET users listing. */
router.get('/user', function(req, res, next) {
  res.send('respond with a resource');
});

function authorize(req, res, next) {
  const authorization = req.headers.authorization
  let token = null;

  //Retrieve token
  if(authorization && authorization.split(" ").length==2){
    token = authorization.split(" ")[1]
  } else{
    res.status(401).json({
      error: true,
      message: "Authorization header ('Bearer token') not found",
    })
    return
  }
  try{
    const decoded = jwt.decode(token, secretKey);

    if(decoded.exp < Date.now()){
      res.status(400).json({
        error: true,
        message: "JWT token has expired",
      })
      return
    }

    //Permit user to advance to route
    next()
  }catch(e){
    res.status(401).json({
      error: true,
      message: "Authorization header is malformed",
    })
  }
}

/* POST user register. */
router.post('/register', function(req, res, next) {
  const email = req.body.email;
  const password = req.body.password;
  console.log("test");
  //verify body.

  if(!email || !password){
    res.status(400).json({
      error: true,
      message: "Request body incomplete, both email and password are required",
    })
    return;
  }
  var exists = false;
  const queryUsers = req.db.from("users").select("*").where("email","=", email);
  queryUsers
    .then((users) => {
      if(users.length > 0){
        console.log("user already exists");
        exists = true;
      }else{
      //Insert user into db
        const saltRounds = 10;
        const hash = bcrypt.hashSync(password, saltRounds)
        return req.db.from("users").insert({email, hash}) 
      }
    })
    .then(() => {
      if(exists == false){
        res.status(201).json({ success: true, message: "Created" })
      }else{
        res.status(400).json({
          error: true,
          message: "User already exists",
        })
      }
      
    })
});

router.post('/login', function(req, res, next) {
  var exists = false;
  const email = req.body.email;
  const password = req.body.password;
  //verify body.

  if(!email || !password){
    res.status(400).json({
      error: true,
      message: "Request body incomplete, both email and password are required",
    })
    return;
  }

  const queryUsers = req.db.from("users").select("*").where("email","=", email);
  queryUsers
    .then((users) => {
      if(users.length == 0){
        exists = false;
        return;
      }else{
        //compare password hashes
        const user = users[0];
        return bcrypt.compare(password, user.hash)
      }
    
      
    })
    .then((match) => {
      if(!match){
        if(exists == false){
          res.status(401).json({
            error: true,
            message: "Incorrect email or password",
          })
        }
        return;
      }

    
      const expires_in = 60*60*24; //1 day
      const exp = Date.now() + expires_in * 1000;
      const token = jwt.sign({email, exp  }, secretKey);
      res.status(200).json({token_type: "Bearer", token, expires_in});
    })

});

router.get('/:email/profile', authorize, function(req, res, next) {
  req.db.from('users').select('email','firstName','lastName','dob','address').where('email','=',req.params.email)
  .then((rows) => {
    if(rows.length==0){
      res.status(400).json({
        error: true,
        message: "User not found",
      })
    }
    res.json(rows[0])
  })
  .catch((err) => {
  console.log(err);
  res.json({"Error" : true, "Message" : "Error in MySQL query"})
  })
});

router.put('/:email/profile', authorize, function(req, res, next) {
  var Email = req.params.email
  var FirstName = req.body.firstName
  var LastName = req.body.lastName
  var Dob = req.body.dob
  var Address = req.body.address

  if(!FirstName || !LastName || !Dob || !Address){
    res.send({
      error: true,
      message: 'Request body incomplete: firstName, lastName, dob and address are required.'
    })
  }
  const authorization = req.headers.authorization  
  token = authorization.split(" ")[1]
  const decoded = jwt.decode(token, secretKey);
  
  if(Email != decoded.email){
    res.status(403)({
      error: true,
      message: 'Forbidden'
    })
    return
  }

  req.db.from('users').where('email','=',Email).update({
    firstName: FirstName,
    lastName: LastName,
    dob: Dob,
    address: Address
  })
  .then((rows) => {
    res.json({
      email: Email,
      firstName: FirstName,
      lastName: LastName,
      dob: Dob,
      address: Address
    })
  })
  

});


// const authorization = req.headers.authorization
//     token = authorization.split(" ")[1]
//     const decoded = jwt.decode(token, secretKey);
//      console.log(decoded.email);


module.exports = router;
