var express = require('express');
var router = express.Router();
var usersRouter = require('./users');
const jwt = require("jsonwebtoken");
const secretKey = "secret key";


//Function to authorize tokens.
function authorize(req, res, next) {
  const authorization = req.headers.authorization
  let token = null;

  //Retrieve token
  if(authorization && authorization.split(" ").length==2){
    token = authorization.split(" ")[1]
    console.log("Token ", token);
  } else{
    res.status(400).json({
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
        message: "Authorization header ('Bearer token') not found",
      })
      return
    }

    //Permit user to advance to route
    next()
  }catch(e){
    res.status(401).json({
      error: true,
      message: "Authorization header ('Bearer token') not found",
    })
  }
}


/* DATA ENDPOINTS */
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'The Hapiness Database API' });
}).use('/user', usersRouter);

/* GET API page. */
router.get('/api', function(req, res, next) {
  res.render('index', { title: 'Lots of routes available' });
});


/* GET Ranking. */
router.get("/rankings", function(req,res, next) {
     
     let length =  Object.keys(req.query).length
      yearvalid = true;
      countryvalid = true;
    
      if(Object.keys(req.query).length > 0){

        if((req.query.year == null && req.query.country == null) || Object.keys(req.query).length > 2){
          res.status(400).json({
            error: true,
            message: "Invalid query parameters. Only year and country are permitted.",
          })
          return;
        }
      }
      
      const regex = /[a-zA-Z]/;
      const pattern = /\d/g;
      const letinyear = regex.test(req.query.year);
      console.log(req.query.country)
      const countryname = pattern.test(req.query.country);

     
      
      if(letinyear && length!= 0 && req.query.year != null){
        yearvalid = false;
        console.log("letter test")
      }
      console.log(countryname)
      if(countryname){
        console.log(countryname + " is nan")
        countryvalid = false;
      }

      if(req.query.year != null){
        if(req.query.year > 2020 || req.query.year < 2015){
          
          yearvalid = false;
         }
      }
      

      if(yearvalid == false || countryvalid == false){
        res.status(400).json({
          error: true,
          message: "Bad Request"
        })
        return;
      }

      if(Object.keys(req.query).length == 0){
        req.db.from('rankings').select('rank','country','score','year').orderBy('year', 'desc')
      .then((rows) => {
        res.json(rows)
        })
        .catch((err) => {
        console.log(err);
        res.json({"Error" : true, "Message" : "Error in MySQL query"})
        }) 
      } 
      
      else if(req.query.year != null && req.query.country == null){
        req.db.from('rankings').select('rank','country','score','year').where('year','=',req.query.year).orderBy('year', 'desc')
        .then((rows) => {
        res.json(rows)
          })
        .catch((err) => {
        console.log(err);
        res.json({"Error" : true, "Message" : "Error in MySQL query"})
        })
      } 
      else if(req.query.country != null && req.query.year == null){
        req.db.from('rankings').select('rank','country','score','year').where('country','=',req.query.country).orderBy('year', 'desc')
      .then((rows) => {
        res.json(rows)
        })
        .catch((err) => {
        console.log(err);
        res.json({"Error" : true, "Message" : "Error in MySQL query"})
        })
      }

      else if(req.query.year != null && req.query.country != null){
        req.db.from('rankings').select('rank','country','score','year').where({'year' : req.query.year, 'country' : req.query.country}).orderBy('year', 'desc')
        .then((rows) => {
        res.json(rows)
          })
        .catch((err) => {
        console.log(err);
        res.json({"Error" : true, "Message" : "Error in MySQL query"})
        })
      }
  });

  /* GET Countries. */
router.get("/countries", function(req,res, next) {
  req.db.from('rankings').distinct('country').orderBy('country')
  .then((rows) => {
    const array = rows.map((item) => item.country);
    res.send(array);
  })
  .catch((err) => {
  res.json({"Error" : true, "Message" : "Error in MySQL query"})
  })
 });

 /* GET Countries. */
router.get("/factors/:year", authorize, function(req,res, next) {
      if(Object.keys(req.query).length === 0){
        req.db.from('rankings').select('*').where("year",'=',req.params.year)
      .then((rows) => {
        res.status(200).json(rows)
        })
        .catch((err) => {
        console.log(err);
        res.json({"Error" : true, "Message" : "Error in MySQL query"})
        }) 
      } 
      
      else if(req.query.limit == null && req.query.country != null){
        req.db.from('rankings').select('*').where({'year': req.params.year, 'country': req.query.country})
        .then((rows) => {
          res.status(200).json(rows)
          })
        .catch((err) => {
        console.log(err);
        res.json({"Error" : true, "Message" : "Error in MySQL query"})
        })
      } 
      else if(req.query.country == null && req.query.limit != null){
        req.db.from('rankings').select('*').where('year', '=', req.params.year).limit(req.query.limit)
      .then((rows) => {
        res.status(200).json(rows)
        })
        .catch((err) => {
        console.log(err);
        res.json({"Error" : true, "Message" : "Error in MySQL query"})
        })
      }

      else if(req.query.limit != null && req.query.country != null){
        req.db.from('rankings').select('*').where({'year': req.params.year,'country': req.query.country}).limit(req.query.limit)
        .then((rows) => {
          res.status(200).json(rows)
          })
        .catch((err) => {
        console.log(err);
        res.json({"Error" : true, "Message" : "Error in MySQL query"})
        })
      }
 });


module.exports = router;
