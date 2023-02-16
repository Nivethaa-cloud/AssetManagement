const express = require("express");
const { body, validationResult } = require("express-validator");
const app = express();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 12; // <-- The lower the number the more hashes per second. Higher = less hashes per second
const UserModel = require("./models/user");
const stockrooms = require("./controllers/stockrooms");
const StockroomModel = require("./models/stockroom");
const OrgModel = require("./models/OrgModel");
const users = require("./routes/users");
const orgs = require("./routes/orgs");
const room = require("./routes/stockrooms");
const Room = require("./models/stockroom"); //import user
const cors = require("cors");
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());
const { check } = require("express-validator");

mongoose.connect(
  "mongodb+srv://estefan:teamwork@cluster0.qf1w4nh.mongodb.net/TechStartUp?retryWrites=true&w=majority"
);

//**USER API**

app.post("/api/v1/users/createUser", (req, res) => {
  const { username, password, password2, organizationID } = req.body;
  //Creating user and password prereqs
  check("name").not().isEmpty().withMessage("Name is required");
  if (!username || !password) {
    return res
      .status(401)
      .json({ msg: "Please enter a username and a password" });
  }
  if (username.length < 6) {
    return res
      .status(401)
      .json({ msg: "Username must be longer then 6 chars" });
  }
  if (password.length < 6) {
    return res
      .status(401)
      .json({ msg: "password must be longer then 6 chars" });
  }
  if (password.search(/\d/) == -1) {
    return res.status(401).json({ msg: "Password Must contain digit" });
  }
  if (password != password2) {
    return res.status(401).json({ msg: "Password does not match" });
  }

  // Checks to see if another username already exists in the database and rejects it if there is one.
  UserModel.findOne({ username: username }).then((user) => {
    if (user) return res.status(400).json({ msg: "User already exists" });

    // This creates a model entry into the database with all the current new registration information.
    const newUser = new UserModel({
      username,
      password,
      organizationID: [],
    });

    // encrypts the password with hashing
    bcrypt.genSalt(saltRounds, (err, salt) =>
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        if (err) throw err;

        newUser.password = hash;

        // saves the user to the database
        // must be inside bcrypt.hash() or else the password saved won't be encrypted
        newUser
          .save()
          .then(res.json({ msg: "Successfully Registered" }))
          .catch((err) => console.log(err));
      })
    );
  });
});

app.post("/api/v1/users/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }

  UserModel.findOne({ username }).then((user) => {
    if (!user) return res.status(400).json({ msg: "User does not exist" });

    bcrypt.compare(password, user.password).then((isMatch) => {
      if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

      res.status(200).json({ msg: " Logged In Successfully", user });
    });
  });
});

app.get("/", (req, res) => {
  res.send({ msg: "hello world" });
});

//STOCKROOM API

//this create a stockroom with a given orgID and name
app.post("/api/v1/addStockroom", async (req, res) => {
  console.log("Adding stockroom");
  const stockroom = req.body;
  const newStockroom = new StockroomModel(stockroom);
  await newStockroom.save();
  res.json(stockroom);
});

app.get("/api/v1/users/viewmembers/:orgName", (req, res) => {
  const orgName = req.params.orgName;
  UserModel.find(
    { organizationID: { $elemMatch: { name: orgName } } },
    { _id: 0, username: 1 }
  ).then((result) => {
    if (result == "")
      return res.status(400).json({
        msg: "Sorry,We did not find any members under this organization",
      });
    else {
      res.json(result);
    }
  });
});

app.get("/api/v1/users/viewAssets/:orgName/:stockroomName", (req, res) => {
  const orgName = req.params.orgName;
  const stockroomName = req.params.stockroomName;

  StockroomModel.find(
    { name: stockroomName, org: orgName },
    { assets: 1, _id: 0 }
  ).then((result) => {
    if (result == "")
      return res.status(400).json({
        msg: "Sorry,We did not find any stockrooms under this organization",
      });
    else {
      return res.status(200).json(result);
    }
  });
});

//gets stockroom by name and org
app.post("/api/v1/deleteStockroom", async (req, res) => {
  console.log("deleting stockroom");

  const { org, stockroomName } = req.body;
  var query = { org: org, name: stockroomName };

  StockroomModel.deleteOne(query, (err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

app.get("/api/v1/users/viewstock/:orgName", (req, res) => {
  const orgName = req.params.orgName;
  StockroomModel.find({ org: orgName }, { name: 1, _id: 0 }).then((result) => {
    if (result == "")
      return res.status(400).json({
        msg: "Sorry,We did not find any stockrooms under this organization",
      });
    else {
      return res.json(result);
    }
  });
});
//END STOCKROOM CALLS

//ORGINZATION API REQUESTS

//All Orgs
app.get("/api/v1/orgs/getOrgs", (req, res) => {
  OrgModel.find({}, (err, result) => {
    if (err) {
      res.json(err);
    } else {
      res.json(result);
    }
  });
});

app.post("/api/v1/org/createOrg", (req, res) => {
  const { name, OrgAccessCode, userid } = req.body;

  //Checks to see if another Organization already exists in the database and rejects it if there is one.
  OrgModel.findOne({ name }).then((org) => {
    if (org)
      return res.status(400).json({ msg: "Organization already exists" });

    //This creates a model entry into the database with all the current new organiziton information.
    const newOrg = new OrgModel({
      name,
      OrgAccessCode,
    });

    // encrypts the password with hashing
    bcrypt.genSalt(saltRounds, (err, salt) =>
      bcrypt.hash(newOrg.OrgAccessCode, salt, (err, hash) => {
        if (err) throw err;

        newOrg.OrgAccessCode = hash;

        //user joins the organization automatically while creating it
        const b = { name: name, Accesscode: OrgAccessCode };
        UserModel.findOneAndUpdate(
          { username: userid },
          { $push: { organizationID: [b] } },
          { upsert: true }
        ).then((result) => {
          if (result) console.log(result);
        });

        // saves the org to the database
        // must be inside bcrypt.hash() or else the password saved won't be encrypted
        newOrg
          .save()
          .then(
            res.status(200).json({ msg: "Successfully Registered", newOrg })
          )
          .catch((err) => console.log(err));
      })
    );
  });
});

app.post("/api/v1/orgs/RenameOrgization", (req, res) => {
  const { nameFeild, newname } = req.body;

  //Checks to see if another Organization already exists in the database and rejects it if there is NOT
  OrgModel.findOneAndUpdate(
    { name: nameFeild },
    { $set: { name: newname } }
  ).then((org) => {
    if (!org) {
      return res.status(400).json({ msg: "Org does not exist " + nameFeild });
    }
    return res.status(200).json({ msg: "Done, succesfully", org });
  });
});

app.post("/api/v1/users/adduserOrg", (req, res) => {
  const { orgname, orgid, userid } = req.body;

  if (!orgname || !orgid) {
    return res.status(400).json({ msg: "Please enter all the fields" });
  }
  OrgModel.findOne({ name: orgname }).then((org) => {
    if (!org)
      return res.status(400).json({ msg: "Organization name does not exist" });

    bcrypt.compare(orgid, org.OrgAccessCode).then((isMatch) => {
      if (!isMatch) return res.status(400).json({ msg: "Invalid access code" });

      const finduser = UserModel.findOne({ username: userid });
      finduser
        .findOne({
          $and: [
            { "organizationID.name": orgname },
            { "organizationID.Accesscode": orgid },
          ],
        })
        .then((msg) => {
          if (msg)
            return res.status(400).json({
              msg: "User alreadys exists under the Organization",
            });
          else {
            const a = { name: orgname, Accesscode: orgid };
            UserModel.findOneAndUpdate(
              { username: userid },
              { $push: { organizationID: [a] } },
              { upsert: true }
            ).then((result) => {
              if (result)
                return res.status(200).json({
                  msg: "User added successfully",
                  org,
                });
            });
          }
        });
    });
  });
});

app.get("/api/v1/orgs/OrgView/:userid", (req, res) => {
  const userid = req.params.userid;
  UserModel.findOne(
    { username: userid },
    { "organizationID.name": 1, _id: 0 }
  ).then((view) => {
    if (view) {
      console.log(view);
      return res.json(view);
    } else {
      return res.status(400).json({
        msg: "Sorry,We did not find any organization for this Username",
      });
    }
  });
});

//ASSETS API
//this creates an asset under a given stockroom
app.post("/api/v1/addAsset", async (req, res) => {
  console.log("Adding asset");
  const stockroom = req.body.stockroomName;
  const asset = req.body.asset;
  const { identifier, category, isAvailable, condition, serialCode, warranty } =
    req.body.asset;
  const filter = { name: stockroom };
  if (
    identifier == null ||
    category == null ||
    isAvailable == null ||
    stockroom == null
  ) {
    return res.status(400).json({ msg: "Missing information" });
  } else {
    const update = { $push: { assets: asset } };
    await StockroomModel.findOneAndUpdate(filter, update);
    res.json(asset);
  }
});

app.post("/api/v1/UpdateAsset", async (req, res) => {
  console.log("updating asset");
  const stockroom = req.body.stockroomName;

  const { identifier } = req.body;
  const {
    newIdentifer,
    newSerialCode,
    newIsAvailable,
    newCategory,
    newCondition,
    newWarranty,
  } = req.body;
  const filter = { name: stockroom };

  StockroomModel.findOne(filter)
    .findOneAndUpdate(
      { "assets.identifier": identifier },
      {
        $set: {
          "assets.$.identifier": newIdentifer,
          "assets.$.serialCode": newSerialCode,
          "assets.$.isAvailable": newIsAvailable,
          "assets.$.category": newCategory,
          "assets.$.condition": newCondition,
          "assets.$.warranty": newWarranty,
        },
      }
    )
    .then((x) => {
      if (!x) {
        return res.status(400).json({ msg: "Error" });
      }
      return res.status(200).json({ msg: "It worked" });
    });
});
app.post("/api/v1/deleteAsset", async (req, res) => {
  console.log("delet asset");
  const stockroom = req.body.stockroomName;
  const { identifier } = req.body;
  const filter = { name: stockroom };

  StockroomModel.findOne(filter)
    .update({}, { $pull: { assets: { identifier: identifier } } })
    .then((x) => {
      if (!x) {
        return res.status(400).json({ msg: "Error" });
      }
      return res.status(200).json({ msg: "It worked" });
    });
});
app.use("/api/v1/orgs/", orgs);

app.use("/api/v1/users", users);

app.listen(PORT, () => {
  console.log("SERVER LISTENING ON PORT ", PORT);
});
