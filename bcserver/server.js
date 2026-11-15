var express=require("express");

let app=express();//returns an object : app

//to start Server
app.listen(2006,function(){
    console.log("Server Started...");
})
app.get("/",function(req,resp)
{
    //__dirname, __filename are  global variables
    let path=__dirname+"/public/index.html";
    resp.sendFile(path);
})
app.get("/availmedecine", function (req, resp) {
    resp.sendFile(__dirname + "/public/availmedecine.html");
});
app.get("/ngodash", function (req, resp) {
    resp.sendFile(__dirname + "/public/ngodashboard.html");
});
app.get("/searchequipments", function (req, resp) {
    resp.sendFile(__dirname + "/public/searchequipments.html");
});
app.get("/donordash", function (req, resp) {
    resp.sendFile(__dirname + "/public/donordashboard.html");
});
app.get("/needydash", function (req, resp) {
    resp.sendFile(__dirname + "/public/needydash.html");
});
app.get("/medmanager", function (req, resp) {
    resp.sendFile(__dirname + "/public/medecinemanager.html");
});

app.get("/login", function (req, resp) {
    resp.sendFile(__dirname + "/public/login.html");
});
app.get("/equipmentmanager", function (req, resp) {
    resp.sendFile(__dirname + "/public/equipmentmanager.html");
});
app.get("/usermaster", function (req, resp) {
    resp.sendFile(__dirname + "/public/usermaster.html");
});
app.get("/needydetails", function (req, resp) {
    resp.sendFile(__dirname + "/public/needydetails.html");
});

app.get("/availequipments", function (req, resp) {
    resp.sendFile(__dirname + "/public/availequipments.html");
});
app.get("/ngoregisteration",function(reqObj,respObj){
    let path=__dirname+"/public/ngoregisteration.html";
    respObj.sendFile(path);
})
app.get("/signup",function(reqObj,respObj){
    let path=__dirname+"/public/signup.html";
    respObj.sendFile(path);
})
app.get("/genai",function(reqObj,respObj){
    let path=__dirname+"/public/genai.html";
    respObj.sendFile(path);
})

app.get("/donorregistration", function (req, resp) {
    resp.sendFile(__dirname + "/public/donorregistration.html");
});
require('dotenv').config();
app.use(express.urlencoded({ extended: true }));

let fileuploader=require("express-fileupload");
app.use(fileuploader());

var mysql = require("mysql2");
let mysqlCon = mysql.createConnection({uri:process.env.AIVEN_URL,dateStrings:true});//sql ka URL aa raha hai 

//Checking if any error exists..
mysqlCon.connect(function(err){
    if(err == null)
    console.log("Connection Successfull");

    else
        console.log(err.message);
});

app.post("/do-signup", function (req, resp) {
    mysqlCon.query("insert into users values(?,?,?,?)",
        [req.body.email, req.body.pwd, req.body.utype, 1],
        function (err) {
            if (err) resp.send(err.message);
            else resp.send("Signup successful");
        });
});
app.post("/update-ngo", async function (req, resp) {
  if (req.files != null) {
        // image uploaded: update everything including picurl
        let filename = req.files.filePic.name;
        let fullPath = __dirname + "/uploads/" + filename;
        await req.files.filePic.mv(fullPath);

        let result = await cloudinary.uploader.upload(fullPath);

        mysqlCon.query(
            "update ngos set ngoname=?, regno=?, typee=?, address=?, city=?, president=?, contact=?, website=?, picurl=? where emailid=?",
            [req.body.ngoname, req.body.regno, req.body.typee, req.body.address,
             req.body.city, req.body.president, req.body.contact, req.body.website,
             result.url, req.body.email],
            function (err) {
                if (err) resp.send(err.message);
                else resp.send("Record updated");
            });
    }
    else {
        // no image: update only text fields
        mysqlCon.query(
            "update ngos set ngoname=?, regno=?, typee=?, address=?, city=?, president=?, contact=?, website=? where emailid=?",
            [req.body.ngoname, req.body.regno, req.body.typee, req.body.address,
             req.body.city, req.body.president, req.body.contact, req.body.website,
             req.body.email],
            function (err) {
                if (err) resp.send(err.message);
                else resp.send("Record updated");
            });
    }
});
app.post("/fetch-ngo", function (req, resp) {
    mysqlCon.query("select * from ngos where emailid=?",
        [req.body.email],
        function (err, result) {
            if (err) resp.send(err.message);
            else resp.json(result);
        });
});

//=================Cloudinary=====================
var cloudinary=require("cloudinary").v2;
cloudinary.config({ 
            cloud_name:process.env.CLOUDINARY_NAME, 
            api_key:process.env.CLOUDINARY_API_KEY, 
            api_secret:process.env.CLOUDINARY_API_SECRET  
        });
app.post("/save-ngo", async function (req, resp) {
   console.log(req.body)
   
    let myUrl="nopic.jpg";

    if(req.files!=null)
    {
        let filename=req.files.filePic.name;
        let fullPath=__dirname+"/uploads/"+filename;
        await req.files.filePic.mv(fullPath);

        //uploading on cloud
        await cloudinary.uploader.upload(fullPath).then(function(picUrlResult)
        {
            myUrl=picUrlResult.url;   //will give u the url of ur pic on cloudinary server
            console.log("************")
            console.log(myUrl);
            console.log("Pic Uploaded Successssfullyy :"+myUrl);
      }); 
       
    }
    
    else
    console.log("NO pic");
    mysqlCon.query(
        "insert into ngos(emailid,ngoname,regno,typee,address,city,president,contact,picurl,website) values(?,?,?,?,?,?,?,?,?,?)",
        [req.body.email, req.body.ngoname, req.body.regno, req.body.typee,
         req.body.address, req.body.city, req.body.president, req.body.contact,
         myUrl, req.body.website],
        function (err) {
            if (err) {
                if (err.code == "ER_DUP_ENTRY")
                    resp.send("Emailid already registered");
                else
                    resp.send(err.message);
            }
            else resp.send("Record saved");
        });
});
app.post("/save-donor", function (req, resp) {
    mysqlCon.query(
        "insert into donors(emailid,name,address,adhaar,pin,region,district,contact,hfrom,htoo) values(?,?,?,?,?,?,?,?,?,?)",
        [req.body.email, req.body.name, req.body.address, req.body.adhaar,
         req.body.pin, req.body.region, req.body.district, req.body.contact,
         req.body.hfrom, req.body.hto],
        function (err) {
            if (err) {
                if (err.code == "ER_DUP_ENTRY")
                    resp.send("Emailid already registered");
                else
                    resp.send(err.message);
            }
            else resp.send("Record saved");
        });
});
app.post("/fetch-donor", function (req, resp) {
    mysqlCon.query("select * from donors where emailid=?",
        [req.body.email],
        function (err, result) {
            if (err) resp.send(err.message);
            else resp.json(result);
        });
});
app.post("/update-donor", function (req, resp) {
    mysqlCon.query(
        "update donors set name=?, address=?, adhaar=?, pin=?, region=?, district=?, contact=?, hfrom=?, htoo=? where emailid=?",
        [req.body.name, req.body.address, req.body.adhaar, req.body.pin,
         req.body.region, req.body.district, req.body.contact,
         req.body.hfrom, req.body.hto, req.body.email],
        function (err, result) {
            if (err) resp.send(err.message);
            else if (result.affectedRows == 0) resp.send("Emailid not found");
            else resp.send("Record updated");
        });
});

app.post("/avail-medecine", async function (req, resp) {

    let myUrl = "nopic.jpg";

    if(req.files!=null)
    {
        let filename=req.files.filePic.name;
        let fullPath=__dirname+"/uploads/"+filename;
        await req.files.filePic.mv(fullPath);

        //uploading on cloud
        await cloudinary.uploader.upload(fullPath).then(function(picUrlResult)
        {
            myUrl=picUrlResult.url;   //will give u the url of ur pic on cloudinary server
            console.log("************")
            console.log(myUrl);
             console.log("Pic Uploaded Successssfullyy :"+myUrl);
      });
       
    }
    else
       console.log("NO pic");
   


    mysqlCon.query(
        "insert into medecines(rid,emailid,medecine,power,company,qty,packing,doexp,picurl) values(null,?,?,?,?,?,?,?,?)",
        [req.body.emailid, req.body.medecine, req.body.power, req.body.company,
         req.body.qty, req.body.packing, req.body.doexp, myUrl],
        function (err) {
            if (err) resp.send(err.message);
            else resp.send("Medicine availed to NGOs");
        });
});
app.post("/avail-equipment", async function (req, resp) {

   
    let myUrl = "nopic.jpg";

    if(req.files!=null)
    {
        let filename=req.files.filePic.name;
        let fullPath=__dirname+"/uploads/"+filename;
        await req.files.filePic.mv(fullPath);

        //uploading on cloud
        await cloudinary.uploader.upload(fullPath).then(function(picUrlResult)
        {
            myUrl=picUrlResult.url;   //will give u the url of ur pic on cloudinary server
            console.log("************")
            console.log(myUrl);
             console.log("Pic Uploaded Successssfullyy :"+myUrl);
      });
       
    }
    else
       console.log("NO pic");

    mysqlCon.query(
        "insert into equipments(rid,emailid,category,picurl) values(null,?,?,?)",
        [req.body.emailid, req.body.category, myUrl],
        function (err) {
            if (err) resp.send(err.message);
            else resp.send("Equipment availed");
        });
});

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);
const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });


async function RajeshBansalKaChirag(imgurl)
{
    const myprompt = "Read the text on picture and tell all the information in adhaar card and give output STRICTLY in JSON format {adhaar_number:'', namee:'', gender:'', dobb: ''}. Dont give output as string.";
    const imageResp = await fetch(imgurl)
        .then((response) => response.arrayBuffer());

    const result = await model.generateContent([
        {
            inlineData: {
                data: Buffer.from(imageResp).toString("base64"),
                mimeType: "image/jpeg",
            },
        },
        myprompt,
    ]);
    console.log(result.response.text());

    const cleaned = result.response.text().replace(/```json|```/g, '').trim();
    const jsonData = JSON.parse(cleaned);
    console.log(jsonData);
    return jsonData;
}


async function ReadAdhaarBack(imgurl)
{
    const myprompt = "Read the text on picture of the back side of adhaar card and give output STRICTLY in JSON format  {address:''}. Dont give output as string.";
    const imageResp = await fetch(imgurl)
        .then((response) => response.arrayBuffer());

    const result = await model.generateContent([
        {
            inlineData: {
                data: Buffer.from(imageResp).toString("base64"),
                mimeType: "image/jpeg",
            },
        },
        myprompt,
    ]);

    const cleaned = result.response.text().replace(/```json|```/g, '').trim();
    const jsonData = JSON.parse(cleaned);
    console.log(jsonData);
    return jsonData;
}


app.post("/save-needy", async function (req, resp)
{
    try {
        if (req.files == null || !req.files.frontPic || !req.files.backPic) {
            resp.send("Please choose both front and rear Adhaar card pictures");
            return;
        }

      
        let frontPath = __dirname + "/uploads/" + req.files.frontPic.namee;
        await req.files.frontPic.mv(frontPath);
        let frontResult = await cloudinary.uploader.upload(frontPath);
        let front = await RajeshBansalKaChirag(frontResult.url);
        
       
        let backPath = __dirname + "/uploads/" + req.files.backPic.namee;
        await req.files.backPic.mv(backPath);
        let backResult = await cloudinary.uploader.upload(backPath);
        let back = await ReadAdhaarBack(backResult.url);

       
 let adhaar = front.adhaar_number.replace(/\s/g, "");
let [dd, mm, yyyy] = front.dobb.split(/[\/-]/);

let dobb = yyyy + "-" + mm + "-" + dd;

        
        mysqlCon.query(
            "insert into needys(emailid,contact,namee,gender,dobb,address,adhaar,frontpic,backpic) values(?,?,?,?,?,?,?,?,?)",
            [req.body.emailid, req.body.contact, front.namee, front.gender, dobb, back.address, adhaar,frontResult.secure_url, backResult.secure_url],
            function (err) {
                if (err) {
                    if (err.code == "ER_DUP_ENTRY")
                        resp.send("Emailid already registered");
                    else
                        resp.send(err.message);
                }
                else resp.send("Record saved for " + front.namee);
            });
    }
    catch (e) {
        console.log(e);
        resp.send("Error: " + e.message);
    }
});


app.get("/get-users", function (req, resp) {
    mysqlCon.query("select emailid, utype, statuss from users",
        function (err, result) {
            if (err) resp.send(err.message);
            else resp.json(result);
        });
});


app.get("/delete-user", function (req, resp) {
    mysqlCon.query("delete from users where emailid=?",
        [req.query.txtEmail],
        function (err, result) {
            if (err) resp.send(err.message);
            else if (result.affectedRows == 0) resp.send("Emailid not found");
            else resp.send("User removed");
        });
});


app.get("/block-user", function (req, resp) {
    mysqlCon.query("update users set statuss=0 where emailid=?",
        [req.query.txtEmail],
        function (err, result) {
            if (err) resp.send(err.message);
            else if (result.affectedRows == 0) resp.send("Emailid not found");
            else resp.send("User blocked");
        });
});


app.get("/resume-user", function (req, resp) {
    mysqlCon.query("update users set statuss=1 where emailid=?",
        [req.query.txtEmail],
        function (err, result) {
            if (err) resp.send(err.message);
            else if (result.affectedRows == 0) resp.send("Emailid not found");
            else resp.send("User resumed");
        });
});


app.get("/get-medicines", function (req, resp) {
    mysqlCon.query("select * from medecines where emailid=?",
        [req.query.txtEmail],
        function (err, result) {
            if (err) resp.send(err.message);
            else resp.json(result);
        });
});


app.get("/delete-medicine", function (req, resp) {
    mysqlCon.query("delete from medecines where rid=?",
        [req.query.rid],
        function (err, result) {
            if (err) resp.send(err.message);
            else if (result.affectedRows == 0) resp.send("Medicine not found");
            else resp.send("Medicine removed");
        });
});

app.get("/get-equipments", function (req, resp) {
    mysqlCon.query("select * from equipments where emailid=?",
        [req.query.txtEmail],
        function (err, result) {
            if (err) resp.send(err.message);
            else resp.json(result);
        });
});


app.get("/delete-equipment", function (req, resp) {
    mysqlCon.query("delete from equipments where rid=?",
        [req.query.rid],
        function (err, result) {
            if (err) resp.send(err.message);
            else if (result.affectedRows == 0) resp.send("Equipment not found");
            else resp.send("Equipment removed");
        });
});

app.post("/do-login", function (req, resp) {

    mysqlCon.query(
        "select * from users where emailid=? and pwd=? and statuss=1",
        [req.body.email, req.body.pwd],
        function (err, result) {

            if (err)
                resp.send(err.message);
            else if (result.length == 0)
                resp.send("Invalid email or password, or account is blocked");
            else
                resp.send(result[0].utype);
        });
});

app.get("/get-dist-cities", function (req, resp) {
    mysqlCon.query("select distinct district  from donors",
        function (err, result) {
            if (err) resp.send(err.message);
            else resp.json(result);
        });
});


app.get("/get-dist-categories", function (req, resp) {
    mysqlCon.query("select distinct category from equipments",
        function (err, result) {
            if (err) resp.send(err.message);
            else resp.json(result);
        });
});

app.get("/find-equipments", function (req, resp) {
    mysqlCon.query(
        "SELECT donors.emailid AS emailid, equipments.category, equipments.picurl FROM donors INNER JOIN equipments ON donors.emailid = equipments.emailid WHERE donors.district = ? AND equipments.category = ?",
        [req.query.city, req.query.category],
        function (err, result) {
            if (err) resp.send(err.message);
            else resp.json(result);
        });
});
app.get("/get-donor", function (req, resp) {
    mysqlCon.query(
        "select emailid, name, address, pin, region, district, contact, hfrom, htoo from donors where emailid=?",
        [req.query.txtEmail],
        function (err, result) {
            if (err) resp.send(err.message);
            else resp.json(result);
        });
});