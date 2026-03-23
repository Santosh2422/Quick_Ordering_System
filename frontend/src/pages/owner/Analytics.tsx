import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
    TrendingUp, Utensils, Clock,
    RefreshCw, CheckCircle,
    IndianRupee
} from "lucide-react";
import analyticsService, { AnalyticsParams } from "@/services/analytics.service";
import { useSocket } from "@/context/SocketContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

const Analytics = () => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [filter, setFilter] = useState<string>("this week");
    const [loading, setLoading] = useState(true);

    const [customDates, setCustomDates] = useState({
        startDate: "",
        endDate: ""
    });

    const [revenueData, setRevenueData] = useState<any>(null);
    const [topItems, setTopItems] = useState<any[]>([]);
    const [categoryData, setCategoryData] = useState<any[]>([]);
    const [tableStats, setTableStats] = useState<any[]>([]);
    const [turnaroundData, setTurnaroundData] = useState<any>(null);
    const [slowMovers, setSlowMovers] = useState<any[]>([]);
    const [highRevenueItems, setHighRevenueItems] = useState<any[]>([]);

    const fetchAllAnalytics = async () => {
        try {
            setLoading(true);
            const params: AnalyticsParams = {
                filter,
                startDate: filter === 'custom' ? customDates.startDate : undefined,
                endDate: filter === 'custom' ? customDates.endDate : undefined
            };

            const [rev, top, cat, tables, turn, slow, high] = await Promise.all([
                analyticsService.getTotalRevenue(params),
                analyticsService.getTopSellingItems(params),
                analyticsService.getCategoryWiseRevenue(params),
                analyticsService.getBusiestTables(params),
                analyticsService.getTableTurnaroundTime(params),
                analyticsService.getSlowMovers(params),
                analyticsService.getHighRevenueItems(params)
            ]);

            if (rev.success) setRevenueData(rev.data);
            if (top.success) setTopItems(top.data);
            if (cat.success) setCategoryData(cat.data);
            if (tables.success) setTableStats(tables.data);
            if (turn.success) setTurnaroundData(turn.data);
            if (slow.success) setSlowMovers(slow.data);
            if (high.success) setHighRevenueItems(high.data);

        } catch (error) {
            console.error("Failed to fetch analytics:", error);
            toast.error("Failed to load analytics data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (filter !== 'custom' || (customDates.startDate && customDates.endDate)) {
            fetchAllAnalytics();
        }
    }, [filter, customDates]);

    useEffect(() => {
        if (!socket || !user?.restaurantId) return;
        socket.emit('join_cashier', user.restaurantId);
        const handleUpdate = () => fetchAllAnalytics();
        socket.on("payment_received", handleUpdate);
        socket.on("new_order_received", handleUpdate);
        return () => {
            socket.off("payment_received", handleUpdate);
            socket.off("new_order_received", handleUpdate);
        };
    }, [socket, user?.restaurantId]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    const stats = [
        { title: "Total Revenue", value: formatCurrency(revenueData?.totalRevenue), icon: IndianRupee, color: "text-green-600", bg: "bg-green-50" },
        { title: "Total Orders", value: revenueData?.totalCustomers || 0, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
        { title: "Avg. Order Value", value: formatCurrency(revenueData?.averageOrderValue), icon: Utensils, color: "text-orange-600", bg: "bg-orange-50" },
        { title: "Avg. Turnaround", value: `${Math.round(turnaroundData?.overallAvgTime || 0)} min`, icon: Clock, color: "text-purple-600", bg: "bg-purple-50" },
    ];

    return (
        <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-12 px-2 md:px-0 max-w-7xl mx-auto">
            
            {/* HEADER & FILTERS */}
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-orange-950">Analytics Dashboard</h1>
                    <p className="text-orange-800/60 font-medium text-sm md:text-base">Monitor restaurant performance and growth</p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {filter === 'custom' && (
                        <div className="flex items-center gap-2 animate-in slide-in-from-top-2 md:slide-in-from-right-4 duration-300">
                            <input
                                type="date"
                                className="flex-1 bg-white border border-orange-100 rounded-xl px-3 py-2 text-xs md:text-sm text-orange-900 focus:outline-none ring-orange-500"
                                value={customDates.startDate}
                                onChange={(e) => setCustomDates({ ...customDates, startDate: e.target.value })}
                            />
                            <span className="text-orange-200 text-xs">to</span>
                            <input
                                type="date"
                                className="flex-1 bg-white border border-orange-100 rounded-xl px-3 py-2 text-xs md:text-sm text-orange-900 focus:outline-none ring-orange-500"
                                value={customDates.endDate}
                                onChange={(e) => setCustomDates({ ...customDates, endDate: e.target.value })}
                            />
                        </div>
                    )}

                    <div className="flex gap-2">
                        <Select value={filter} onValueChange={setFilter}>
                            <SelectTrigger className="flex-1 sm:w-[160px] bg-white border-orange-100 rounded-xl">
                                <SelectValue placeholder="Select Range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="this week">This Week</SelectItem>
                                <SelectItem value="this month">This Month</SelectItem>
                                <SelectItem value="custom">Custom Range</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-xl border-orange-100 hover:bg-orange-50 flex-shrink-0"
                            onClick={fetchAllAnalytics}
                            disabled={loading}
                        >
                            <RefreshCw className={`w-4 h-4 text-orange-600 ${loading ? "animate-spin" : ""}`} />
                        </Button>
                    </div>
                </div>
            </div>

            {/* SUMMARY STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm rounded-3xl bg-white">
                        <CardContent className="p-5 md:p-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl ${stat.bg} flex-shrink-0`}>
                                    <stat.icon className={`w-5 h-5 md:w-6 md:h-6 ${stat.color}`} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] md:text-xs font-bold text-orange-900/40 uppercase tracking-wider truncate">{stat.title}</p>
                                    <h3 className="text-lg md:text-2xl font-bold text-orange-950 truncate">{stat.value}</h3>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* CHARTS GRID 1 */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
                {/* TOP SELLING ITEMS */}
                <Card className="border-none shadow-lg shadow-orange-900/5 rounded-[2rem] md:rounded-[2.5rem] bg-white overflow-hidden">
                    <CardHeader className="bg-orange-50/30 p-5 md:p-6">
                        <CardTitle className="text-lg md:text-xl font-bold text-orange-950">Top Selling Items</CardTitle>
                        <CardDescription className="text-xs md:text-sm">Popular items by quantity sold</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[280px] md:h-[350px] p-2 md:p-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topItems} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fef3c7" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9a3412', fontSize: 10 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9a3412', fontSize: 10 }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="totalSold" fill="#f97316" radius={[6, 6, 0, 0]} barSize={window.innerWidth < 768 ? 20 : 32} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* REVENUE LEADERS */}
                <Card className="border-none shadow-lg shadow-orange-900/5 rounded-[2rem] md:rounded-[2.5rem] bg-white overflow-hidden">
                    <CardHeader className="bg-orange-50/30 p-5 md:p-6">
                        <CardTitle className="text-lg md:text-xl font-bold text-orange-950">Revenue Leaders</CardTitle>
                        <CardDescription className="text-xs md:text-sm">Items generating the most income</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[280px] md:h-[350px] p-2 md:p-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={highRevenueItems} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#fef3c7" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#9a3412', fontSize: 10 }} width={80} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                <Bar dataKey="itemRevenue" fill="#84cc16" radius={[0, 6, 6, 0]} barSize={16} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* CHARTS GRID 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* CATEGORY PERFORMANCE */}
                <Card className="lg:col-span-2 border-none shadow-lg shadow-orange-900/5 rounded-[2rem] md:rounded-[2.5rem] bg-white overflow-hidden">
                    <CardHeader className="bg-orange-50/30 p-5 md:p-6 flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-lg md:text-xl font-bold text-orange-950">Category Performance</CardTitle>
                            <CardDescription className="text-xs md:text-sm">Revenue distribution by category</CardDescription>
                        </div>
                        <div className="hidden sm:block p-2 rounded-xl bg-orange-100 text-orange-600">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 md:p-6">
                        <div className="space-y-5">
                            {categoryData.slice(0, 5).map((cat, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <div className="min-w-0">
                                            <p className="font-bold text-orange-950 text-sm md:text-base truncate">{cat.categoryName}</p>
                                            <p className="text-[10px] text-orange-800/40 font-bold uppercase tracking-tight">{cat.categoryTotalQuantity} items sold</p>
                                        </div>
                                        <p className="font-black text-orange-600 text-sm md:text-base ml-2">{formatCurrency(cat.categoryTotalRevenue)}</p>
                                    </div>
                                    <div className="h-1.5 md:h-2 w-full bg-orange-50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min(100, (cat.categoryTotalRevenue / (revenueData?.totalRevenue || 1)) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* SLOW MOVERS */}
                <Card className="border-none shadow-lg shadow-orange-900/5 rounded-[2rem] md:rounded-[2.5rem] bg-white overflow-hidden">
                    <CardHeader className="bg-red-50/50 p-5 md:p-6">
                        <CardTitle className="text-lg md:text-xl font-bold text-red-900">Slow Movers</CardTitle>
                        <CardDescription className="text-xs md:text-sm">Low sales volume items</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5 md:p-6">
                        {slowMovers.length > 0 ? (
                            <div className="space-y-3">
                                {slowMovers.slice(0, 5).map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50/50 border border-gray-100 italic transition-all hover:bg-white hover:shadow-sm">
                                        <div className="min-w-0">
                                            <span className="font-bold text-gray-700 text-xs md:text-sm block truncate">{item.name}</span>
                                            <span className="text-[9px] text-gray-400 font-bold uppercase">{item.category}</span>
                                        </div>
                                        <div className="text-right flex-shrink-0 ml-2">
                                            <span className="text-xs md:text-sm font-black text-red-500">{item.totalSold}</span>
                                            <p className="text-[9px] text-gray-400 font-bold uppercase">Sold</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center py-10 text-center">
                                <CheckCircle className="w-10 h-10 text-green-500/20 mb-3" />
                                <p className="text-gray-400 text-sm font-medium">All items performing well!</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* TABLE ANALYTICS */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
                {/* BUSIEST TABLES */}
                <Card className="border-none shadow-lg shadow-orange-900/5 rounded-[2rem] md:rounded-[2.5rem] bg-white overflow-hidden">
                    <CardHeader className="bg-orange-50/30 p-5 md:p-6">
                        <CardTitle className="text-lg md:text-xl font-bold text-orange-950">Busiest Tables</CardTitle>
                        <CardDescription className="text-xs md:text-sm">Sessions and revenue ranking</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[400px]">
                                <thead className="text-[9px] md:text-[10px] text-orange-900/40 uppercase font-black tracking-widest bg-orange-50/20">
                                    <tr>
                                        <th className="px-5 md:px-6 py-4">Table</th>
                                        <th className="px-5 md:px-6 py-4">Occupancy</th>
                                        <th className="px-5 md:px-6 py-4 text-right">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-orange-50 font-medium text-orange-950">
                                    {tableStats.map((table, i) => (
                                        <tr key={i} className="hover:bg-orange-50/50 transition-colors">
                                            <td className="px-5 md:px-6 py-4 font-bold italic text-xs md:text-sm">#{table.tableNumber}</td>
                                            <td className="px-5 md:px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-12 md:w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-orange-400" style={{ width: `${Math.min(100, (table.sessionCount / (tableStats[0]?.sessionCount || 1)) * 100)}%` }} />
                                                    </div>
                                                    <span className="text-[10px] md:text-xs">{table.sessionCount}x</span>
                                                </div>
                                            </td>
                                            <td className="px-5 md:px-6 py-4 text-right font-black text-xs md:text-sm truncate">{formatCurrency(table.totalRevenue)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* TURNAROUND TIME */}
                <Card className="border-none shadow-lg shadow-orange-900/5 rounded-[2rem] md:rounded-[2.5rem] bg-white overflow-hidden">
                    <CardHeader className="bg-orange-50/30 p-5 md:p-6">
                        <CardTitle className="text-lg md:text-xl font-bold text-orange-950">Turnaround Time</CardTitle>
                        <CardDescription className="text-xs md:text-sm">Average minutes per table session</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[280px] md:h-[350px] p-2 md:p-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={turnaroundData?.tableBreakdown || []} layout="vertical" margin={{ left: 10, right: 30 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#fef3c7" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="table" type="category" axisLine={false} tickLine={false} tick={{ fill: '#9a3412', fontSize: 10 }} tickFormatter={(val) => `T${val}`} width={30} />
                                <Tooltip contentStyle={{ borderRadius: '12px' }} cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="avgTime" fill="#fb923c" radius={[0, 6, 6, 0]} barSize={14} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Analytics;