const db = require(".././models");
const seq = require("sequelize");
const op = seq.Op;
require("dotenv").config();

/**
 * Add a new category to the database.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */

const addCategorie = async (req, res, next) => {
    try {
        const { title, isPublished, supperCatID, icon } = req.body.data;
        // Check if the necessary data (title) is provided
        if (!title) {
            return res.send({
                message: "Error! Title is required.",
                code: 409
            });
        }

        // Creating a new category record in the database
        const newCategorie = await db.categorie.create({
            title: title,
            isPublished: isPublished,
            isSubCategory: supperCatID ? true : false,
            publishedAt: isPublished ? new Date() : null,
            icon: icon,
            supperCatID: supperCatID
        });

        return res.send({
            message: `Category '${title}' has been added successfully.`,
            newCategory: newCategorie,
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while adding the category.",
            error: error.message,
            code: 400
        });
    }
};

/**
 * Delete a category from the database.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */

const removeCategorie = async (req, res, next) => {
    try {
        const categorieId = req.params.id; // Assuming the category ID is passed as a parameter in the URL

        if (!categorieId) {
            return res.send({
                message: "Error! Category ID is required for deletion.",
                code: 400
            });
        }
        await db.categorie.destroy({
            where: {
                supperCatID: categorieId
            },
            force: true // This ensures that it deletes even if the associations are not properly defined
        });
        await db.categorie.destroy({
            where: { ID_ROWID: categorieId }
        });

        return res.send({
            message: "Category deleted successfully!",
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while deleting the category.",
            error: error.message,
            code: 400
        });
    }
};

const updateCategorie = async (req, res, next) => {
    try {
        const categorieId = req.params.id;  // Assuming the category ID is passed as a parameter in the URL
        const { title, isPublished, supperCatID, icon } = req.body.data;

        // Check if category ID is provided
        if (!categorieId || !title) {
            return res.send({
                message: "Error! Category ID is required for updating.",
                code: 400
            });
        }

        // Updating the category record in the database
        await db.categorie.update({
            title: title,
            isPublished: isPublished,
            isSubCategory: supperCatID ? true : false,
            publishedAt: isPublished ? new Date() : null,
            icon: icon,
            supperCatID: supperCatID
        }, {
            where: { ID_ROWID: categorieId }
        });
        const updatedData = await db.categorie.findByPk(categorieId, {
            include: {
                model: db.categorie,
                as: 'categories',
                attributes: ['ID_ROWID']
            }
        });
        return res.send({
            message: `Category with ID '${categorieId}' has been updated successfully.`,
            updatedData: updatedData,
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while updating the category.",
            error: error.message,
            code: 400
        });
    }
};
const listCategories = async (req, res, next) => {
    try {
        const categories = await db.categorie.findAll({
            include: {
                model: db.categorie,
                as: 'categories',
                attributes: ['ID_ROWID']
            }
        });
        console.log(categories);
        return res.send({
            message: "List of all categories.",
            categories: categories,
            code: 200
        });
    } catch (error) {
        return res.send({
            message: "An error occurred while fetching categories.",
            error: error.message,
            code: 400
        });
    }
};
const selectedListCategories = async (req, res, next) => {
    try {
        const result = await db.categorie.findAll({
            include: {
                model: db.categorie,
                as: 'categories',
                attributes: ['ID_ROWID']
            }
        });
        const categories = result.filter(category => category.categories.length == 0);

        return res.send({
            message: "List of all categories.",
            categories: categories,
            code: 200
        });
    } catch (error) {
        return res.send({
            message: "An error occurred while fetching categories.",
            error: error.message,
            code: 400
        });
    }
};
const Fuse = require('fuse.js');

const exploreSearchCategories = async (req, res, next) => {
    try {
        const findKey = req.body.Key;

        if (!findKey) {
            return res.send({
                message: "Search key is missing.",
                categories: null,
                code: 200
            });
        }

        const itemsForSearching = await db.categorie.findAll({
            attributes: ['title', 'discription', 'isPublished', 'isSubCategory', 'supperCatID']
        });

        const options = {
            includeScore: true,
            keys: ['title', 'discription']
        };

        const fuse = new Fuse(itemsForSearching, options);
        const result = fuse.search(findKey);
        const filteredItems = result.map(item => item.item);
        return res.send({
            message: "Search results for categories.",
            categories: filteredItems,
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred during the search.",
            error: error.message,
            code: 400
        });
    }
};

// Exporting the functions so they can be used elsewhere

module.exports = {
    addCategorie,
    updateCategorie,
    removeCategorie,
    listCategories,
    selectedListCategories,
    exploreSearchCategories
};
