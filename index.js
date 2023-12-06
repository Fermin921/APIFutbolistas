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

const multer = require('multer');
const folder = path.join(__dirname+'/archivos/');
const storage = multer.diskStorage({
    destination : function(req,file,cb) {cb(null,folder)},
    filename: function (req,file,cb) {cb(null,file.originalname)}
});
const upload = multer({storage:storage})
app.use(express.urlencoded({extended:true}));
app.use(upload.single('archivo'));
const PORT = process.env.PORT || 8080
const PORTE = process.env.MYSQLPORT ;
const HOST = process.env.MYSQLHOST || 'localhost';
const USER = process.env.MYSQLUSER || 'root';
const PASSWORD = process.env.MYSQLPASSWORD || '';
const DATABASE = process.env.MYSQL_DATABASE || 'Futbolista';
const URL = process.env.URL

const MySqlConnection = {host : HOST, user : USER, password : PASSWORD, database: DATABASE,port : PORTE}
const data = fs.readFileSync(path.join(__dirname,'./Options.json'),{ encoding: 'utf8', flag: 'r' });
const obj = JSON.parse(data)

const swaggerOptions = {
    definition: obj,
    apis: [`${path.join(__dirname,"./index.js")}`],
}
/**
* @swagger
* /futbolistas:
*   get:
*     summary: Obtener la lista de futbolistas.
*     description: Endpoint para obtener todos los futbolistas de la base de datos.
*     responses:
*       200:
*         description: OK. La solicitud fue exitosa.
*         content:
*           application/json:
*             example:
*               - id: 1
*                 nombre: "Lionel Messi"
*                 posicion: "Delantero"
*                 edad: 34
*               - id: 2
*                 nombre: "Cristiano Ronaldo"
*                 posicion: "Delantero"
*                 edad: 36
*       500:
*         description: Error interno del servidor.
*         content:
*           application/json:
*             example:
*               mensaje: "Error en la base de datos. Mensaje específico del error SQL."
*/
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
/**
 * @swagger
 * /Futbolistas/{posicion}:
 *   get:
 *     summary: Obtener futbolistas por posición.
 *     description: Endpoint para obtener futbolistas filtrados por su posición.
 *     parameters:
 *       - in: path
 *         name: posicion
 *         description: Posición del futbolista a buscar.
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK. La solicitud fue exitosa.
 *         content:
 *           application/json:
 *             example:
 *               - id: 1
 *                 nombre: "Lionel Messi"
 *                 posicion: "Delantero"
 *                 edad: 34
 *               - id: 2
 *                 nombre: "Cristiano Ronaldo"
 *                 posicion: "Delantero"
 *                 edad: 36
 *       404:
 *         description: No encontrado. No se encontraron futbolistas con la posición especificada.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Usuario no encontrado"
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Error en la base de datos. Mensaje específico del error SQL."
 */
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
/**
 * @swagger
 * /insertar:
 *   post:
 *     summary: Insertar un nuevo futbolista.
 *     description: Endpoint para agregar un nuevo futbolista a la base de datos.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             nombre: "Nuevo Futbolista"
 *             posicion: "Delantero"
 *             edad: 25
 *             dorsal: 10
 *             nacionalidad: "Argentina"
 *     responses:
 *       200:
 *         description: OK. La solicitud fue exitosa.
 *         content:
 *           application/json:
 *             example:
 *               message: "Datos insertados correctamente de Nuevo Futbolista"
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             example:
 *               message: "Error al insertar datos. Mensaje específico del error SQL."
 */
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
/**
 * @swagger
 * /Futbolista/{nombre}:
 *   put:
 *     summary: Actualiza la información de un futbolista por su nombre.
 *     description: Endpoint para actualizar los detalles de un futbolista específico en la base de datos.
 *     parameters:
 *       - in: path
 *         name: nombre
 *         required: true
 *         description: Nombre del futbolista que se va a actualizar.
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Datos actualizados del futbolista.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               posicion:
 *                 type: string
 *                 description: Nueva posición del futbolista.
 *               edad:
 *                 type: integer
 *                 description: Nueva edad del futbolista.
 *               dorsal:
 *                 type: integer
 *                 description: Nuevo dorsal del futbolista.
 *               nacionalidad:
 *                 type: string
 *                 description: Nueva nacionalidad del futbolista.
 *     responses:
 *       200:
 *         description: Se ha actualizado exitosamente la información del futbolista.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: Futbolista actualizado correctamente. Nombre: {nombre_actualizado}
 *       500:
 *         description: Error interno del servidor al intentar actualizar la información del futbolista.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: Error al actualizar el futbolista en la base de datos. Detalles: {error_message}
 */
app.put("/Futbolista/:nombre", async (req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const { posicion,edad,dorsal,nacionalidad } = req.body;
        console.log(req.body);
        await conn.query('UPDATE Futbolista SET  posicion = ? ,edad = ?, dorsal = ?, nacionalidad = ? WHERE nombre = ?', [posicion,edad,dorsal,nacionalidad,req.params.nombre]);
        res.json({ mensaje: "ACTUALIZADO "+req.params.nombre});
    } catch (err) {
        res.status(500).json({ mensaje: err.sqlMessage });
    }
});
/**
 * @swagger
 * /Futbolista/{nombre}:
 *   delete:
 *     summary: Eliminar un futbolista.
 *     description: Endpoint para eliminar un futbolista de la base de datos.
 *     parameters:
 *       - in: path
 *         name: nombre
 *         description: Nombre del futbolista a eliminar.
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK. La solicitud fue exitosa.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Registro Eliminado [nombre del futbolista]"
 *       404:
 *         description: No encontrado. El futbolista con el nombre especificado no existe.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Registro No Eliminado"
 *       500:
 *         description: Error interno del servidor.
 *         content:
 *           application/json:
 *             example:
 *               mensaje: "Error al eliminar datos. Mensaje específico del error SQL."
 */
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