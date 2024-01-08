const db = require(".././models");
const seq = require("sequelize");
const op = seq.Op;
require("dotenv").config();
// for Home Page
const getPrincipaleCategories = async (req, res, next) => {
    try {
        const listPrincipaleCat = await db.categorie.findAll({
            where: {
                isSubCategory: false,
                supperCatID: null,
                isPublished: true
            }
        })
        return res.send({
            message: `Fetch all principale catgories successfully.`,
            categories: listPrincipaleCat,
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
const getLatestPrograms = async (req, res, next) => {
    try {
        const programs = await db.program.findAll({
            where: {
                isPublished: true, // Filter for published programs
                PublishedDate: {
                    [op.ne]: null, // PublishedDate should not be null
                }
            },
            include: {
                model: db.categorie,
            },
            order: [['PublishedDate', 'DESC']], // Order by PublishedDate in descending order
            limit: 3 // Limit the result to 3 programs
        });
        return res.send({
            message: `Fetch latest programs successfully.`,
            programs: programs,
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

// for Categories List
/** all cat with subCat */
const listCategories = async (req, res, next) => {
    try {
        const allCategories = await db.categorie.findAll({
            where: {
                isSubCategory: false,
                supperCatID: null,
                isPublished: true
            },
            attributes: ['ID_ROWID', 'title', 'supperCatID'],
        });

        const categoryHierarchy = {};

        const buildCategoryHierarchy = async (parentCategory) => {
            const key = parentCategory.ID_ROWID;
            const result = await db.categorie.findAll({
                where: {
                    isPublished: true,
                    supperCatID: key
                },
                attributes: ['ID_ROWID', 'title', 'supperCatID'],
            });
            const subCategories = result.filter(category => category.supperCatID === key);

            if (subCategories.length > 0) {
                parentCategory.subCategories = {};
                for (const subCategory of subCategories) {
                    parentCategory.subCategories[subCategory.ID_ROWID] = {
                        ...subCategory.get(),
                        open: false,
                        subCategories: {}, // Initialize subcategories object
                    };
                    await buildCategoryHierarchy(parentCategory.subCategories[subCategory.ID_ROWID]);
                }
            }
        };

        for (const rootCategory of allCategories) {
            if (!rootCategory.supperCatID) {
                categoryHierarchy[rootCategory.ID_ROWID] = {
                    ...rootCategory.get(),
                    open: false,
                    subCategories: {}, // Initialize subcategories object
                };
                await buildCategoryHierarchy(categoryHierarchy[rootCategory.ID_ROWID]);
            }
        }

        return res.send({
            message: "List of all categories.",
            categories: categoryHierarchy,
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


const listCategoriesForSpecificOpenMainCategory = async (req, res, next) => {
    try {
        const { idMainCat } = req.body;
        console.log("idMainCat       ..............");
        const allCategories = await db.categorie.findAll({
            where: {
                isSubCategory: false,
                supperCatID: null,
                isPublished: true
            },
            attributes: ['ID_ROWID', 'title', 'supperCatID'],
        });

        const categoryHierarchy = {};

        const buildCategoryHierarchy = async (parentCategory) => {
            const key = parentCategory.ID_ROWID;
            const result = await db.categorie.findAll({
                where: {
                    isPublished: true,
                    supperCatID: key
                },
                attributes: ['ID_ROWID', 'title', 'supperCatID'],
            });
            const subCategories = result.filter(category => category.supperCatID === key);

            if (subCategories.length > 0) {
                parentCategory.subCategories = {};
                for (const subCategory of subCategories) {
                    parentCategory.subCategories[subCategory.ID_ROWID] = {
                        ...subCategory.get(),
                        open: false,
                        subCategories: {}, // Initialize subcategories object
                    };
                    await buildCategoryHierarchy(parentCategory.subCategories[subCategory.ID_ROWID]);
                }
            }
        };

        for (const rootCategory of allCategories) {
            if (!rootCategory.supperCatID) {
                categoryHierarchy[rootCategory.ID_ROWID] = {
                    ...rootCategory.get(),
                    open: idMainCat == rootCategory.ID_ROWID ? true : false,
                    subCategories: {}, // Initialize subcategories object
                };
                await buildCategoryHierarchy(categoryHierarchy[rootCategory.ID_ROWID]);
            }
        }

        return res.send({
            message: "List of all categories.",
            categories: categoryHierarchy,
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
/**  get category path */
const catPath = async (req, res, next) => {
    try {
        const { catID } = req.body;
        const cat = await db.categorie.findByPk(catID, {
            where: {
                isPublished: true
            },
            attributes: ['ID_ROWID', 'title', 'supperCatID'],
        });

        if (!cat) {
            return res.status(404).send({
                message: "Category not found.",
                code: 404
            });
        }

        const categoryPath = [];

        const buildCategoryPath = async (category) => {
            const key = category.ID_ROWID;
            const supperCatID = category.supperCatID;

            // Add the current category to the beginning of the path array
            categoryPath.unshift({
                ID_ROWID: category.ID_ROWID,
                title: category.title
            });

            if (supperCatID) {
                const catResult = await db.categorie.findByPk(supperCatID, {
                    where: {
                        isPublished: true
                    },
                    attributes: ['ID_ROWID', 'title', 'supperCatID'],
                });
                await buildCategoryPath(catResult);
            }
        };

        await buildCategoryPath(cat);
        console.log(categoryPath)
        return res.send({
            message: "Category path retrieved successfully.",
            categoryPath: categoryPath,
            code: 200
        });
    } catch (error) {
        return res.status(500).send({
            message: "An error occurred while fetching categories.",
            error: error.message,
            code: 500
        });
    }
}


// programs List For a specifique Category
const getProgramsForCat = async (req, res, next) => {
    try {
        const { categID } = req.body;
        const programs = await db.program.findAll({
            where: {
                categID: categID,
                isPublished: true
            },
        })
        return res.send({
            message: 'Request succeed',
            programs: programs,
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while fetching the programs.",
            error: error.message,
            code: 400
        });
    }
};
// all programs
const getPrograms = async (req, res, next) => {
    try {
        const programs = await db.program.findAll({
            where: {
                isPublished: true
            },
        })
        return res.send({
            message: 'Request succeed',
            programs: programs,
            code: 200
        });

    } catch (error) {
        return res.send({
            message: "An error occurred while fetching the programs.",
            error: error.message,
            code: 400
        });
    }
};
// program profile
const getProgram = async (req, res, next) => {
    try {
        const programId = req.body.id;  // Assuming the category ID is passed as a parameter in the URL
        // Check if category ID is provided
        if (!programId) {
            return res.send({
                message: "Error! Programme ID is required for updating.",
                code: 400
            });
        }
        // get programme data
        const program = await db.program.findByPk(programId,
            {
                include: {
                    model: db.categorie,
                    as: 'categorie',
                    attributes: ['ID_ROWID', 'title']
                },
            });
        let data;
        if (program.type == "formation") {
            const progWithFormation = await db.program.findByPk(programId, {
                include: [
                    {
                        model: db.formation,
                    }
                ]
            });
            data = progWithFormation.formation;
        }
        else if (program.type == "cour") {
            const progWithCour = await db.program.findByPk(programId, {
                include: [
                    {
                        model: db.cour,
                    }
                ]
            });
            data = progWithCour.cour;
        }
        return res.send({
            message: `fetch Data avec succes`,
            program: program,
            data: data,
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


module.exports = {
    // for home Page
    getPrincipaleCategories,
    getLatestPrograms,
    // for categorie list
    listCategories,
    listCategoriesForSpecificOpenMainCategory,
    catPath,
    // for programs list && profil
    getProgramsForCat,
    getPrograms,
    getProgram
}