import express from 'express';
import Category from '../models/category.model.js';

const router = express.Router();

router.post('/categories', async (req, res) => {
    try {
        // Check if categories already exist
        const existingCategories = await Category.find();
        if (existingCategories.length > 0) {
            return res.status(200).json({ 
                message: 'Categories already exist', 
                categories: existingCategories 
            });
        }

        // Create default categories
        const defaultCategories = [
            {
                title: 'Electronics',
                description: 'Electronic devices and gadgets',
                createdBy: 'Admin',
                stock: 0,
                tagID: 1,
                isSubCategory: false
            },
            {
                title: 'Computers',
                description: 'Computers and computer accessories',
                createdBy: 'Admin',
                stock: 0,
                tagID: 2,
                isSubCategory: false
            },
            {
                title: 'Clothing',
                description: 'Apparel and fashion items',
                createdBy: 'Admin',
                stock: 0,
                tagID: 3,
                isSubCategory: false
            },
            {
                title: 'Home & Garden',
                description: 'Home improvement and garden items',
                createdBy: 'Admin',
                stock: 0,
                tagID: 4,
                isSubCategory: false
            },
            {
                title: 'Sports',
                description: 'Sports and outdoor equipment',
                createdBy: 'Admin',
                stock: 0,
                tagID: 5,
                isSubCategory: false
            }
        ];

        const createdCategories = await Category.insertMany(defaultCategories);
        
        res.status(201).json({
            message: 'Default categories created successfully',
            categories: createdCategories
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error creating categories', 
            error: error.message 
        });
    }
});

export default router;
