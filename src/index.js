const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const db = require('../models');
const bcrypt=require('bcrypt');
const jwt=require('jsonwebtoken');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet());

//Auth Middleware

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({error: 'no token provided'});
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (err) {
        res.status(401).json({error: 'invalid or expired token'});
    }
}

//check if items are in stock before creating an order
async function checkStock(productId, quantity) {
    const inventoryItem = await db.Inventory.findOne({where: {productId}});
    
    if (!inventoryItem) {
        
        return false;
    }
    
    return inventoryItem.stockQuantity >= quantity;
}

app.get('/health',(req,res)=>{
    res.json({status:'ok'})
});



app.get('/categories',async(req,res)=>{
    try{
    const categories=await db.Category.findAll();
    res.json(categories);
    }
    catch(err){
        res.status(500).json({error:'failed to load categories'});
    }

});


app.post('/categories', authMiddleware, async(req,res)=>{
    try{
        const category=await db.Category.create(req.body);
        res.status(201).json(category);
    }
    catch(err){
        res.status(500).json({error:'failed to create category'});
    }
});


app.get('/categories/:id',async(req,res)=>{
    try{
        const category=await db.Category.findByPk(req.params.id);
        if(!category){
            return res.status(404).json({error:'category not found'});
        }
        res.json(category);
    }catch(err){
        res.status(500).json({error:'failed to get category'});

    }
});


app.put('/categories/:id', authMiddleware, async(req,res)=>{
    try{
        const category=await db.Category.findByPk(req.params.id);
        if(!category){
            return res.status(404).json({error:'category not found'});
        }
        await category.update(req.body);
        res.json(category);
    }catch(err){
        res.status(500).json({error:'failed to update category'});
    }
});

app.delete('/categories/:id', authMiddleware, async(req,res)=>{
    try{
        const category=await db.Category.findByPk(req.params.id);
        if(!category){
            return res.status(404).json({error:'category not found'});
        }
        await category.destroy();
        res.json({message:'category deleted successfully'});

    }
    catch(err){
        res.status(500).json({error:'failed to delete category'});
    }
});




//CRUD for products
app.get('/products',async(req,res)=>{
    try{
        let products;
        if(req.query.category){
            products=await db.Product.findAll({where:{categoryId:req.query.category}});
        }
        else{
            products=await db.Product.findAll();
        }
        
        res.json(products);
    }
    catch(err){
        res.status(500).json({error:'failed to load products'});
    }

});


app.post('/products', authMiddleware,  async (req, res) => {
    try {
        const product = await db.Product.create(req.body);
        res.status(201).json(product);
        
    } catch (err) {
        res.status(500).json({error: 'failed to create product'});
    }
});

app.get('/products/:id', async (req, res) => {
    try {
        const product = await db.Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({error: 'product not found'});
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({error: 'failed to get product'});
    }
});

app.put('/products/:id', authMiddleware,  async (req, res) => {
    try {
        const product = await db.Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({error: 'product not found'});
        }
        await product.update(req.body);
        res.json(product);
    } catch (err) {
        res.status(500).json({error: 'failed to update product'});
    }
});

app.delete('/products/:id', authMiddleware,  async (req, res) => {
    try {
        const product = await db.Product.findByPk(req.params.id);
        if (!product) {
            return res.status(404).json({error: 'product not found'});
        }
        await product.destroy();
        res.json({message: 'product deleted successfully'});
    } catch (err) {
        res.status(500).json({error: 'failed to delete product'});
    }
});


//Authentication 
 
app.post('/auth/signup',async(req,res) => {

    try{

    const{name,email,password,phone}=req.body;
    const hashedPassword=await bcrypt.hash(password, 10);
    const user= await db.User.create({
        name,
        email,
        password:hashedPassword,
        phone
    });
    res.status(201).json({
         id: user.id,
        name: user.name,
        email: user.email
    });
 }catch(err){
    res.status(500).json({error:'failed to create user'});
 }


});

app.post('/auth/login', async(req,res)=>{
    try{
    const{email,password}=req.body;
    const user=await db.User.findOne({where:{email}});
    if(!user){
        return res.status(401).json({message:'Invalid credentials'});
    }
    
        const isMatch=await bcrypt.compare(password,user.password);

        if(!isMatch){
            return res.status(401).json({message:'invalid credentials'});

        }
        const token = jwt.sign({id: user.id}, process.env.JWT_SECRET, {expiresIn: '7d'});
        res.json({token});



    
    }
    catch(err){
        res.status(500).json({error:'login failed'});

    }

});

//Inventory
app.get('/inventory', authMiddleware, async(req,res)=>{
    try{
    const inventory=await db.Inventory.findAll();
    res.json(inventory);
    }
    catch(err){
        res.status(500).json({error:'failed to load inventory'});
    }
});


app.get('/inventory/:id', authMiddleware, async(req,res)=>{
    try{
        const inventoryItem= await db.Inventory.findOne({where:{productId:req.params.id}});
        if(!inventoryItem){
            return res.status(404).json({error:'inventory item not found'});
        }
        res.json(inventoryItem);

    }
    catch(err){
        res.status(500).json({error:'failed to get inventory item'});
    }
});



app.put('/inventory/:id', authMiddleware, async(req,res)=>{
    try{
        const inventoryItem= await db.Inventory.findOne({where:{productId:req.params.id}});
        if(!inventoryItem){
            return res.status(404).json({error:'inventory item not found'});
        }
        await inventoryItem.update(req.body);
        res.json(inventoryItem);

    }
    catch(err){
        res.status(500).json({error:'failed to update inventory item'});
    }
});






const PORT = process.env.PORT || 5000;
db.sequelize.authenticate()
  .then(() => console.log('Database connected successfully'))
  .catch((err) => console.error('Database connection failed:', err));
app.listen(PORT,()=>{
    console.log(`server is running on ${PORT}`);
});