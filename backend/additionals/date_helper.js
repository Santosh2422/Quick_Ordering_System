// server/utils/dateHelpers.js

export const getDateRange = (filter, customStart, customEnd) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    // Set 'end' to the end of today
    end.setHours(23, 59, 59, 999);

    switch (filter) {
        case 'today':
            start.setHours(0, 0, 0, 0);
            break;

        case 'this week':
            const day = now.getDay(); // 0 (Sun) to 6 (Sat)
            
            // Calculate difference to get to Monday (Monday is index 1)
            // If today is Sunday (0), we need to go back 6 days to get to previous Monday.
            // If today is Monday (1), diff is 0.
            // If today is Tuesday (2), diff is 1.
            const diff = day === 0 ? 6 : day - 1; 

            start.setDate(now.getDate() - diff);
            start.setHours(0, 0, 0, 0);
            break;

        case 'this month':
            // Start from 1st of current month
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            break;

        case 'custom':
            if (customStart && customEnd) {
                start = new Date(customStart);
                end = new Date(customEnd);
                end.setHours(23, 59, 59, 999);
            }
            break;
            
        default:
            start.setHours(0, 0, 0, 0);
            break;
    }

    return { start, end };
};