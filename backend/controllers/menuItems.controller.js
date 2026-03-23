//here i am adding items to backend category wise
// ill get all items of a category at once in one api call
import Menu from "../models/menu.model.js";
import Restaurant from "../models/restaurants.model.js";
import User from "../models/user.model.js";
import qrTable from "../models/qr.model.js";

// POST /api/menu/add-items-bulk
export const addBulkMenuItems = async (req, res) => {
    try {
        // 1. Extract and Validate Input
        let { category, categoryName, items } = req.body;
        const finalCategory = category || categoryName;

        if (!finalCategory) {
            return res.status(400).json({ 
                success: false, 
                message: "Category name is required" 
            });
        }

        let { restaurantId, id } = req.user;

        // 2. Robust Fallback for restaurantId
        if (!restaurantId) {
            const userProfile = await User.findById(id);
            restaurantId = userProfile?.restaurantId;
        }

        // 3. Check if restaurantId exists at all
        if (!restaurantId) {
            return res.status(404).json({ 
                success: false, 
                message: "Restaurant link not found. Please contact support." 
            });
        }

        let restUser = await Restaurant.findOne({ uid: restaurantId });

        // 4. Ownership Sync Logic
        if (restUser && restUser.owner.toString() !== id) {
            const userProfile = await User.findById(id);
            if (userProfile && userProfile.role === 'owner' && userProfile.restaurantId === restaurantId) {
                restUser.owner = id;
                await restUser.save();
                console.log(`[Ownership Sync] Fixed owner for restaurant ${restaurantId} to ${id}`);
            }
        }

        // 5. Permission & Resource Update Logic
        if (restUser && restUser.owner.toString() === id) {
            let menu = await Menu.findOne({ restaurantId });
            
            if (!menu) {
                menu = await Menu.create({ restaurantId, categories: [] });
            }

            const categoryIndex = menu.categories.findIndex(
                (cat) => cat.name.toLowerCase() === finalCategory.toLowerCase()
            );

            const itemsToAdd = Array.isArray(items) ? items : [];

            if (categoryIndex > -1) {
                // Update existing category
                if (itemsToAdd.length > 0) {
                    menu.categories[categoryIndex].items.push(...itemsToAdd);
                }
            } else {
                // Create new category
                menu.categories.push({
                    name: finalCategory,
                    items: itemsToAdd
                });
            }

            await menu.save();
            return res.status(200).json({ 
                success: true, 
                message: "Batch added successfully", 
                menu 
            });

        } else {
            // 6. Access Denied (403 is more appropriate than 404 here)
            return res.status(403).json({ 
                success: false, 
                message: "Access Denied: Restaurant record not found or ownership mismatch" 
            });
        }

    } catch (error) {
        // 7. Server Error (500)
        console.error("Controller Error: ", error.message);
        return res.status(500).json({ 
            success: false, 
            message: "Internal Server Error: " + error.message 
        });
    }
};

// PUT /api/menu/update-item
//to edit youll show a pencil button to only those users wh are admins
export const updateMenuItem = async (req, res) => {
    try {
        // const { restaurantId, id } = req.user;
        let { restaurantId, id } = req.user;

        if (!restaurantId) {
            const userProfile = await User.findById(id);
            restaurantId = userProfile?.restaurantId;
        }

        if (!restaurantId) {
            return res.status(200).json({ success: false, message: "Restaurant link not found." });
        }

        const { categoryId, itemId, updateData } = req.body;

        // Verify updateData exists and isn't empty
        if (!updateData || Object.keys(updateData).length === 0) {
            return res.status(200).json({ success: false, message: "No update data provided in 'updateData' object" });
        }

        let restUser = await Restaurant.findOne({ uid: restaurantId });

        // --- OWNERSHIP SYNC ---
        if (restUser && restUser.owner.toString() !== id) {
            const userProfile = await User.findById(id);
            if (userProfile && userProfile.role === 'owner' && userProfile.restaurantId === restaurantId) {
                restUser.owner = id;
                await restUser.save();
                console.log(`[Ownership Sync-Update] Fixed owner for restaurant ${restaurantId} to ${id}`);
            }
        }

        // Ownership Check
        if (!restUser || restUser.owner.toString() !== id) {
            return res.status(200).json({ success: false, message: "Access Denied: Only owners can update the menu" });
        }

        // 1. Construct the Dynamic Set Object
        const setOptions = {};

        // Now we loop through the explicitly extracted 'updateData' object
        for (const key in updateData) {
            setOptions[`categories.$[cat].items.$[itm].${key}`] = updateData[key];
        }

        // 2. The Atomic Update Query (Same as before)
        const updatedMenu = await Menu.findOneAndUpdate(
            { restaurantId: restaurantId },
            { $set: setOptions },
            {
                new: true,
                arrayFilters: [
                    { "cat._id": categoryId },
                    { "itm._id": itemId }
                ]
            }
        );

        if (!updatedMenu) {
            return res.status(200).json({ success: false, message: "Menu, Category, or Item not found" });
        }

        return res.status(200).json({ success: true, message: "Item updated", menu: updatedMenu });

    } catch (error) {
        console.error("Update failed:", error);
        return res.status(200).json({ success: false, message: error.message });
    }
};

export const getMenu = async (req, res) => {
    try {
        // Priority: Auth User > Path Params (Supports both Owner and Customer views)
        const restaurantId = req.user?.restaurantId || req.params.restaurantId;
        console.log("Hi Hello Namaste")

        if (!restaurantId) {
            return res.status(400).json({ success: false, message: "Restaurant ID is required" });
        }

        const tableNumber = req.query.table || null;
        let tableName = null;

        // 0. Resolve Table Name if tableNumber (ID or ShortID) is provided
        if (tableNumber) {
            try {
                const tableDoc = await qrTable.findOne({
                    restaurantId,
                    $or: [
                        { tableShortId: tableNumber },
                        { _id: tableNumber.match(/^[0-9a-fA-F]{24}$/) ? tableNumber : undefined }
                    ].filter(Boolean)
                }).lean(); // Lean for faster performance
                console.log("tableDoc: ", tableDoc);

                if (tableDoc) {
                    tableName = tableDoc.tableName;
                }
            } catch (err) {
                console.error("Error resolving table name in getMenu:", err);
                console.log("Error Is: ", err);
            }
        }

        // 1. Fetch Menu using .lean() to get a plain JSON object immediately
        const menuDoc = await Menu.findOne({ restaurantId })
            .populate({
                path: 'restaurantDetails',
                select: 'name address uid image'
            })
            .lean(); 
        
        console.log("Menu Doc: ", menuDoc);

        if (!menuDoc) {
            return res.status(404).json({ success: false, message: "Menu not found for this restaurant" });
        }

        // 2. THE CLEANER 🧹
        // We filter out anything marked as 'isDeleted' (Soft-delete support)
        const activeMenu = (menuDoc.categories || [])
            .filter(cat => !cat.isDeleted) 
            .map(cat => ({
                ...cat,
                items: (cat.items || []).filter(item => !item.isDeleted)
            }));
        
            console.log("Active Menu: ", activeMenu);

        // 3. Final Response
        return res.status(200).json({
            success: true,
            restaurant: menuDoc.restaurantDetails,
            menu: activeMenu, 
            table: tableNumber,
            tableName: tableName
        });

    } catch (error) {
        console.error("Critical Error in getMenu:", error);
        // Use 500 for true server exceptions
        return res.status(500).json({ success: false, message: "An internal server error occurred" });
    }
};


export const deleteMenuItem = async (req, res) => {
    try {
        let { restaurantId, id } = req.user;

        // 1. Resolve restaurantId
        if (!restaurantId) {
            const userProfile = await User.findById(id);
            restaurantId = userProfile?.restaurantId;
        }

        if (!restaurantId) {
            return res.status(200).json({ success: false, message: "Restaurant link not found." });
        }

        const { categoryId, itemId } = req.body;

        if (!categoryId || !itemId) {
            return res.status(200).json({ success: false, message: "Category ID and Item ID are required" });
        }

        // 2. Ownership Check
        let restaurant = await Restaurant.findOne({ uid: restaurantId });
        if (!restaurant) {
            return res.status(200).json({ success: false, message: "Restaurant not found" });
        }

        // --- Ownership Sync (Keeping your existing logic) ---
        if (restaurant.owner.toString() !== id) {
            const userProfile = await User.findById(id);
            if (userProfile && userProfile.role === 'owner' && userProfile.restaurantId === restaurantId) {
                restaurant.owner = id;
                await restaurant.save();
            }
        }

        if (restaurant.owner.toString() !== id) {
            return res.status(200).json({ success: false, message: "Access Denied: You are not the owner" });
        }

        // 3. PERFORM SOFT DELETE
        // We use arrayFilters to target the specific category and the specific item
        const updatedMenu = await Menu.findOneAndUpdate(
            { restaurantId: restaurantId },
            {
                $set: {
                    "categories.$[cat].items.$[item].isDeleted": true
                }
            },
            {
                arrayFilters: [
                    { "cat._id": categoryId },  // Find the category
                    { "item._id": itemId }      // Find the item inside that category
                ],
                new: true // Return updated doc
            }
        );

        if (!updatedMenu) {
            return res.status(200).json({ success: false, message: "Menu, Category, or Item not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Item hidden successfully",
            menu: updatedMenu
        });

    } catch (error) {
        console.error("Soft Delete Item Error:", error);
        return res.status(200).json({ success: false, message: error.message });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        // 1. Get User Info
        let { restaurantId, id } = req.user;

        if (!restaurantId) {
            const userProfile = await User.findById(id);
            restaurantId = userProfile?.restaurantId;
        }

        if (!restaurantId) {
            return res.status(200).json({ success: false, message: "Restaurant link not found." });
        }

        // 2. Get Data from Body
        const { categoryId } = req.body;

        if (!categoryId) {
            return res.status(200).json({ success: false, message: "Category ID is required" });
        }

        // 3. Ownership Check
        const restUser = await Restaurant.findOne({ uid: restaurantId });
        if (!restUser || restUser.owner.toString() !== id) {
            return res.status(200).json({ success: false, message: "Access Denied" });
        }

        // 4. PERFORM SOFT DELETE (Using $set instead of $pull)
        const updatedMenu = await Menu.findOneAndUpdate(
            {
                restaurantId: restaurantId,
                "categories._id": categoryId // Locate the specific category
            },
            {
                $set: { "categories.$.isDeleted": true } // Flip the flag on the matched category
            },
            { new: true }
        );

        if (!updatedMenu) {
            return res.status(200).json({ success: false, message: "Category or Menu not found" });
        }

        return res.status(200).json({
            success: true,
            message: "Category hidden successfully",
            menu: updatedMenu
        });

    } catch (error) {
        console.error("Soft Delete Category Error:", error);
        return res.status(200).json({ success: false, message: "Internal Server Error" });
    }
};