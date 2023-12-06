const express=require('express');
const morgan = require('morgan');
const fs=require('fs');
const path=require('path');
const mysql =require('mysql2/promise');
const bearerToken = require('express-bearer-token'); 
const app=express();
const cors = require('cors');
var accessLogStream = fs.createWriteStream(path.join(__dirname,'access.log'),{flags:'a'});
const swaggerUI = require('swagger-ui-express');
const swaggerjsDoc= require('swagger-jsdoc');
app.use(morgan('combined',{stream:accessLogStream}));
app.use(cors());
app.use(express.json());
app.use(bearerToken());

const data = fs.readFileSync(path.join(__dirname,'./Options.json'),{ encoding: 'utf8', flag: 'r' });
const obj = JSON.parse(data)

const swaggerOptions = {
    definition: obj,
    apis: [`${path.join(__dirname,"./index.js")}`],
}

const PORT = process.env.PORT || 8080
const PORTE = process.env.MYSQLPORT ;
const HOST = process.env.MYSQLHOST || 'localhost';
const USER = process.env.MYSQLUSER || 'root';
const PASSWORD = process.env.MYSQLPASSWORD || '';
const DATABASE = process.env.MYSQL_DATABASE || 'Futbolista';
const URL = process.env.URL

const MySqlConnection = {host : HOST, user : USER, password : PASSWORD, database: DATABASE,port : PORTE}

app.get("/futbolistas", async (req, res) => {    
    try {
        const token = req.token;

            const conn = await mysql.createConnection(MySqlConnection);
            const [rows, fields] = await conn.query('SELECT * from Futbolista');
            res.json(rows);
        
    } catch (err) {
        res.status(500).json({ mensaje: err.sqlMessage });
    }
});

app.get("/Futbolistas/:posicion",async(req,res)=>{    
    console.log(req.params.posicion);
        
    const conn = await mysql.createConnection(MySqlConnection);
    
    const [rows, fields] = await conn.query('SELECT * FROM Futbolista WHERE posicion = ?', [req.params.posicion]);
    
    if (rows.length === 0) {
        res.status(404).json({ mensaje: "Usuario no encontrado" });
    } else {
        res.json(rows);
    }
});

app.post('/insertar', async (req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);

        const { nombre,posicion,edad,dorsal,nacionalidad} = req.body;

        const [rows, fields] = await conn.execute('INSERT INTO Futbolista (nombre,posicion , edad, dorsal, nacionalidad) VALUES (?, ?, ?,?,?)', [nombre,posicion,edad,dorsal,nacionalidad]);

        res.json({ message: 'Datos insertados correctamente de '+nombre });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al insertar datos' });
    }
});

app.put("/Futbolista/:nombre", async (req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const { nombre,posicion,edad,dorsal,nacionalidad } = req.body;
        console.log(req.body);
        await conn.query('UPDATE Futbolista SET nombre = ?, posicion = ? ,edad = ?, dorsal = ?, nacionalidad = ? WHERE nombre = ?', [nombre,posicion,edad,dorsal,nacionalidad,req.params.nombre]);
        res.json({ mensaje: "ACTUALIZADO"+nombre });
    } catch (err) {
        res.status(500).json({ mensaje: err.sqlMessage });
    }
});

app.delete("/Futbolista/:nombre", async (req, res) => {    
    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const nombres = req.params.nombre;
        const [rows, fields] = await conn.query('DELETE FROM Futbolista WHERE nombre = ?', [req.params.nombre]);

        if (rows.affectedRows == 0) {
            res.json({ mensaje: "Registro No Eliminado" });
        } else {
            res.json({ mensaje: "Registro Eliminado"+nombres });
        }

    } catch (err) {
        res.status(500).json({ mensaje: err.sqlMessage });
    }
});

const swaggerDocs = swaggerjsDoc(swaggerOptions);

app.use("/api-docs",swaggerUI.serve,swaggerUI.setup(swaggerDocs));
app.get("/options",(req,res)=>
{
    res.json(data)
})

app.use("/api-docs-json",(req,res)=>{
    res.json(swaggerDocs);
});



app.listen(PORT,()=>{
    console.log("Servidor express escuchando en el puerto "+PORT);
});