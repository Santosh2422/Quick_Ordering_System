import Orders from '../models/orders.model.js'
import { getDateRange } from '../additionals/date_helper.js'
import Restaurant from '../models/restaurants.model.js';
import Session from '../models/session.model.js';
import Menu from '../models/menu.model.js';
import mongoose from 'mongoose';

export const getTopItems = async (req, res) => {
    try {
        const { filter, startDate, endDate } = req.query; // e.g., ?filter=weekly

        // 1. Get the Date Objects
        const { start, end } = getDateRange(filter, startDate, endDate);
        const { id, restaurantId } = req.user;

        const restaurant = await Restaurant.findOne({ uid: restaurantId }).select("owner");

        if (restaurant.owner.toString() !== id.toString()) {
            return res.status(200).json({
                success: false,
                message: "User is not the owner"
            });
        }

        const topItems = await Orders.aggregate([
            // --- STAGE 1: FILTER BY DATE (The New Part) ---
            {
                $match: {
                    restaurantId: restaurantId,
                    createdAt: { $gte: start, $lte: end },
                    status: 'paid'
                }
            },

            // --- STAGE 2: UNWIND (Existing) ---
            { $unwind: "$items" },

            // --- STAGE 3: GROUP (Existing) ---
            {
                $group: {
                    _id: "$items.menuItemId",
                    name: { $first: "$items.name" },
                    totalSold: { $sum: "$items.quantity" },
                    totalRevenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
                }
            },

            // --- STAGE 4: SORT & LIMIT ---
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);

        res.status(200).json({ success: true, data: topItems, dateRange: { start, end } });

    } catch (error) {
        res.status(200).json({ success: false, message: error.message });
    }
};


export const getTotalRevenue = async (req, res) => {
    try {
        const { filter, startDate, endDate } = req.query;

        const { restaurantId, id } = req.user;

        const restaurant = await Restaurant.findOne({ uid: restaurantId }).select("owner");

        if (restaurant.owner.toString() !== id.toString()) {
            return res.status(200).json({
                success: false,
                message: "User is not the owner"
            });
        }


        // 2. Get Date Range
        const { start, end } = getDateRange(filter, startDate, endDate);

        // 3. Aggregation Pipeline
        const revenueData = await Session.aggregate([
            {
                $match: {
                    restaurantId: restaurantId,
                    status: 'closed',
                    endTime: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmount" },
                    totalCustomers: { $sum: 1 },
                    averageOrderValue: { $avg: "$totalAmount" }
                }
            }
        ]);

        // 4. Handle Empty Results (if no sales found)
        const stats = revenueData[0] || {
            totalRevenue: 0,
            totalSessions: 0,
            averageOrderValue: 0
        };

        res.status(200).json({
            success: true,
            data: stats,
            dateRange: { start, end }
        });

    } catch (error) {
        console.error("Revenue Analytics Error:", error);
        res.status(200).json({ success: false, message: error.message });
    }
};

export const getLowPerformingItems = async (req, res) => {
    try {
        const { filter, startDate, endDate } = req.query;

        const { restaurantId, id } = req.user;

        const restaurant = await Restaurant.findOne({ uid: restaurantId }).select("owner -_id");

        if (restaurant.owner.toString() !== id.toString()) {
            return res.status(200).json({
                success: false,
                message: "User is not the owner"
            });
        }

        // 2. GET DATE RANGE
        const { start, end } = getDateRange(filter, startDate, endDate);

        // --- STEP A: Get Sales Volume from Orders ---
        const salesData = await Orders.aggregate([
            {
                $match: {
                    restaurantId: restaurantId,
                    createdAt: { $gte: start, $lte: end },
                    status: 'paid'
                }
            },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.menuItemId",
                    totalSold: { $sum: "$items.quantity" }
                }
            }
        ]);

        // Map sales for easy lookup: { "itemId": volume }
        const salesMap = {};
        salesData.forEach(item => {
            salesMap[item._id.toString()] = item.totalSold;
        });

        // --- STEP B: Get the ACTIVE Menu only ---
        const menuDoc = await Menu.findOne({ restaurantId: restaurantId }).lean();

        if (!menuDoc) {
            return res.status(200).json({ success: false, message: "Menu not found" });
        }

        const activeItems = [];
        menuDoc.categories.forEach(category => {
            //  SOFT DELETE CHECK: Only process active categories
            if (!category.isDeleted) {
                category.items.forEach(item => {
                    // SOFT DELETE CHECK: Only process active items
                    if (!item.isDeleted) {
                        activeItems.push({
                            itemId: item._id.toString(),
                            name: item.name,
                            price: item.price,
                            category: category.name
                        });
                    }
                });
            }
        });

        // --- STEP C: Merge Sales with Active Menu ---
        const performanceReport = activeItems.map(item => ({
            ...item,
            totalSold: salesMap[item.itemId] || 0 // Items with no sales get 0
        }));

        // --- STEP D: Sort by Performance (Ascending) ---
        // This puts 0-sale items at the top, then 1, 2, etc.
        performanceReport.sort((a, b) => a.totalSold - b.totalSold);

        // Return the bottom 5 or 10
        const lowPerformers = performanceReport.slice(0, 10);

        res.status(200).json({
            success: true,
            data: lowPerformers,
            dateRange: { start, end }
        });

    } catch (error) {
        console.error("Low Performer Analytics Error:", error);
        res.status(200).json({ success: false, message: error.message });
    }
};


export const getHighRevenueItems = async (req, res) => {
    try {
        const { filter, startDate, endDate } = req.query;

        const { restaurantId, id } = req.user;

        const restaurant = await Restaurant.findOne({ uid: restaurantId }).select("owner -_id");

        if (restaurant.owner.toString() !== id.toString()) {
            return res.status(200).json({
                success: false,
                message: "User is not the owner"
            });
        }
        // 2. GET DATE RANGE
        const { start, end } = getDateRange(filter, startDate, endDate);

        // 3. AGGREGATION PIPELINE
        const highRevenueItems = await Orders.aggregate([
            // STAGE 1: Filter by Restaurant and Date
            {
                $match: {
                    restaurantId: restaurantId,
                    createdAt: { $gte: start, $lte: end },
                    status: { $ne: 'cancelled' }
                }
            },

            // STAGE 2: Deconstruct the items array
            { $unwind: "$items" },

            // STAGE 3: Group and Calculate Revenue per Item
            {
                $group: {
                    _id: "$items.menuItemId",
                    name: { $first: "$items.name" },
                    totalQuantity: { $sum: "$items.quantity" },
                    itemRevenue: {
                        $sum: { $multiply: ["$items.price", "$items.quantity"] }
                    }
                }
            },

            { $sort: { itemRevenue: -1 } },

            // STAGE 5: Top 5 High Earners
            { $limit: 5 }
        ]);

        // Safety check for null IDs (as discussed previously)
        const cleanData = highRevenueItems.filter(item => item._id !== null);

        res.status(200).json({
            success: true,
            data: cleanData,
            dateRange: { start, end }
        });

    } catch (error) {
        console.error("High Revenue Analytics Error:", error);
        res.status(200).json({ success: false, message: error.message });
    }
};

export const getTopItemsByCategory = async (req, res) => {
    try {
        const { filter, startDate, endDate } = req.query;

        const { restaurantId, id } = req.user;

        const restaurant = await Restaurant.findOne({ uid: restaurantId }).select("owner -_id");

        if (restaurant.owner.toString() !== id.toString()) {
            return res.status(200).json({
                success: false,
                message: "User is not the owner"
            });
        }

        const { start, end } = getDateRange(filter, startDate, endDate);

        const categoryPerformance = await Orders.aggregate([
            // STAGE 1: Filter Orders
            {
                $match: {
                    restaurantId: restaurantId,
                    createdAt: { $gte: start, $lte: end },
                    status: 'paid'
                }
            },
            // STAGE 2: Flatten items array
            { $unwind: "$items" },
            // STAGE 3: Group by menuItemId to get totals
            {
                $group: {
                    _id: "$items.menuItemId",
                    name: { $first: "$items.name" },
                    totalRevenue: { $sum: "$items.totalPrice" },
                    totalQuantity: { $sum: "$items.quantity" }
                }
            },
            { $sort: { totalQuantity: -1 } },

            // STAGE 5: The Join with Menu
            {
                $lookup: {
                    from: "menus",
                    let: { orderItemId: "$_id" },
                    pipeline: [
                        { $match: { restaurantId: restaurantId } },
                        { $unwind: "$categories" },
                        { $unwind: "$categories.items" },
                        {
                            $match: {
                                $expr: {
                                    $eq: ["$categories.items._id", { $toObjectId: "$$orderItemId" }]
                                }
                            }
                        },
                        { $project: { categoryName: "$categories.name" } }
                    ],
                    as: "categoryDetails"
                }
            },
            { $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: false } },

            // STAGE 6: Group into categories with the list of items
            {
                $group: {
                    _id: "$categoryDetails.categoryName",
                    categoryTotalQuantity: { $sum: "$totalQuantity" },
                    items: {
                        $push: {
                            name: "$name",
                            quantity: "$totalQuantity",
                            revenue: "$totalRevenue"
                        }
                    }
                }
            },
            { $sort: { categoryTotalQuantity: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: categoryPerformance,
            dateRange: { start, end }
        });

    } catch (error) {
        console.error("Category Analytics Error:", error);
        res.status(200).json({ success: false, message: error.message });
    }
};


export const getCategoryRevenueLeaderboard = async (req, res) => {
    try {
        const { filter, startDate, endDate } = req.query;

        const { restaurantId, id } = req.user;

        const restaurant = await Restaurant.findOne({ uid: restaurantId }).select("owner -_id");

        if (restaurant.owner.toString() !== id.toString()) {
            return res.status(200).json({
                success: false,
                message: "User is not the owner"
            });
        }
        const { start, end } = getDateRange(filter, startDate, endDate);

        const leaderboard = await Orders.aggregate([
            // STAGE 1: Filter Orders (Ensure status matches your DB values)
            {
                $match: {
                    restaurantId: restaurantId,
                    createdAt: { $gte: start, $lte: end },
                    status: 'paid' // Make sure your orders are actually marked 'paid'
                }
            },
            // STAGE 2: Flatten items
            { $unwind: "$items" },
            // STAGE 3: Group by item to sum revenue
            {
                $group: {
                    _id: "$items.menuItemId",
                    name: { $first: "$items.name" },
                    itemRevenue: { $sum: "$items.totalPrice" },
                    totalSold: { $sum: "$items.quantity" }
                }
            },
            // STAGE 4: Robust Join with Menu
            {
                $lookup: {
                    from: "menus",
                    let: { orderItemId: "$_id" }, // Pass the String ID from Order
                    pipeline: [
                        { $match: { restaurantId: restaurantId } },
                        { $unwind: "$categories" },
                        { $unwind: "$categories.items" },
                        {
                            $match: {
                                $expr: {
                                    // ✅ Fix: Convert the order String ID to ObjectId for comparison
                                    $eq: ["$categories.items._id", { $toObjectId: "$$orderItemId" }]
                                }
                            }
                        },
                        { $project: { categoryName: "$categories.name" } }
                    ],
                    as: "categoryDetails"
                }
            },
            // STAGE 5: Extract the Category Name (Don't unwind if you want to keep data)
            { $unwind: "$categoryDetails" },

            // STAGE 6: Sort items by QUANTITY (As requested)
            { $sort: { totalSold: -1 } },

            // STAGE 7: Group by Category Name
            {
                $group: {
                    _id: "$categoryDetails.categoryName",
                    categoryTotalQuantity: { $sum: "$totalSold" },
                    categoryTotalRevenue: { $sum: "$itemRevenue" },
                    topItems: {
                        $push: {
                            name: "$name",
                            revenue: "$itemRevenue",
                            quantity: "$totalSold"
                        }
                    }
                }
            },
            // STAGE 8: Final Polish
            {
                $project: {
                    _id: 0,
                    categoryName: "$_id",
                    categoryTotalQuantity: 1,
                    categoryTotalRevenue: 1,
                    topItems: { $slice: ["$topItems", 5] }
                }
            },
            { $sort: { categoryTotalQuantity: -1 } }
        ]);

        console.log("leader board: ", leaderboard);

        res.status(200).json({
            success: true,
            data: leaderboard,
            dateRange: { start, end }
        });

    } catch (error) {
        console.error("Leaderboard Error:", error);
        res.status(200).json({ success: false, message: error.message });
    }
};



export const getTableTurnaroundTime = async (req, res) => {
    try {
        const { filter, startDate, endDate } = req.query;

        const { restaurantId, id } = req.user;

        const restaurant = await Restaurant.findOne({ uid: restaurantId }).select("owner -_id");

        if (restaurant.owner.toString() !== id.toString()) {
            return res.status(200).json({
                success: false,
                message: "User is not the owner"
            });
        }

        // 1. Resolve restaurantId
        const targetId = restaurantId;

        // 2. Get Date Range
        const { start, end } = getDateRange(filter, startDate, endDate);

        const turnaroundStats = await Session.aggregate([
            {
                $match: {
                    restaurantId: targetId,
                    status: "closed", // Only count completed sessions
                    endTime: { $exists: true }, // Safety check
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $project: {
                    tableNumber: 1,
                    // Calculate duration in minutes
                    durationInMinutes: {
                        $divide: [
                            { $subtract: ["$endTime", "$createdAt"] },
                            1000 * 60 // Convert milliseconds to minutes
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: "$tableNumber", // Group by table to see which tables turn faster
                    avgTime: { $avg: "$durationInMinutes" },
                    sessionCount: { $sum: 1 }
                }
            },
            {
                $group: {
                    _id: null,
                    overallAvgTime: { $avg: "$avgTime" }, // Global average for the restaurant
                    tableBreakdown: {
                        $push: {
                            table: "$_id",
                            avgTime: { $round: ["$avgTime", 1] },
                            sessions: "$sessionCount"
                        }
                    }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: turnaroundStats[0] || { overallAvgTime: 0, tableBreakdown: [] }
        });

    } catch (error) {
        console.error("Turnaround Error:", error);
        res.status(200).json({ success: false, message: error.message });
    }
};


export const getBusiestTables = async (req, res) => {
    try {
        const { filter, startDate, endDate } = req.query;

        const { restaurantId, id } = req.user;

        const restaurant = await Restaurant.findOne({ uid: restaurantId }).select("owner -_id");

        if (restaurant.owner.toString() !== id.toString()) {
            return res.status(200).json({
                success: false,
                message: "User is not the owner"
            });
        }

        // 1. Resolve restaurantId (Securely)
        const targetId = restaurantId;

        // 2. Get Date Range
        const { start, end } = getDateRange(filter, startDate, endDate);

        const tableStats = await Session.aggregate([
            {
                $match: {
                    restaurantId: targetId,
                    createdAt: { $gte: start, $lte: end },
                    status: "closed"
                }
            },
            {
                $group: {
                    _id: "$tableNumber",
                    sessionCount: { $sum: 1 }, // How many times it was occupied
                    totalRevenue: { $sum: "$totalAmount" }, // Total money earned from this table
                    avgOrderValue: { $avg: "$totalAmount" } // Average spend per session
                }
            },
            {
                // Sort by sessionCount (Busiest first) 
                // Change to totalRevenue if you want "Most Profitable" first
                $sort: { sessionCount: -1 }
            },
            {
                $project: {
                    _id: 0,
                    tableNumber: "$_id",
                    sessionCount: 1,
                    totalRevenue: { $round: ["$totalRevenue", 2] },
                    avgOrderValue: { $round: ["$avgOrderValue", 2] }
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: tableStats,
            dateRange: { start, end }
        });

    } catch (error) {
        console.error("Busiest Tables Error:", error);
        res.status(200).json({ success: false, message: error.message });
    }
};