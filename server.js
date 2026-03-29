require("dotenv").config()

const app = require("./src/app.js");
const connectToDB = require("./src/config/db.js");

const port = 3000;

connectToDB();

app.listen(port, (req, res)=> {
    console.log(`Server is running on ${port}`);
});