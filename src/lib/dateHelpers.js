export const isWithinRange = (dateStr, start, end) => {
  if (!dateStr || !start || !end) return false;
  return dateStr >= start && dateStr <= end;
};

export const getComparisonRange = (start, end, mode) => {
  if (!start || !end) {
    const today = new Date().toISOString().split("T")[0];
    return { start: today, end: today, label: "Today" };
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (mode === "previous_period") {
    const oneDay = 1000 * 60 * 60 * 24;
    const daysLength =
      Math.round((endDate.getTime() - startDate.getTime()) / oneDay) + 1;

    const prevEnd = new Date(startDate);
    prevEnd.setDate(prevEnd.getDate() - 1);

    const prevStart = new Date(prevEnd);
    prevStart.setDate(prevStart.getDate() - (daysLength - 1));

    return {
      start: prevStart.toISOString().split("T")[0],
      end: prevEnd.toISOString().split("T")[0],
      label: "Previous Period",
    };
  } else if (mode === "prev_week") {
    const pStart = new Date(startDate);
    pStart.setDate(pStart.getDate() - 7);
    const pEnd = new Date(endDate);
    pEnd.setDate(pEnd.getDate() - 7);
    return {
      start: pStart.toISOString().split("T")[0],
      end: pEnd.toISOString().split("T")[0],
      label: "Last Week",
    };
  } else {
    const pStart = new Date(startDate);
    pStart.setMonth(pStart.getMonth() - 1);
    const pEnd = new Date(endDate);
    pEnd.setMonth(pEnd.getMonth() - 1);
    return {
      start: pStart.toISOString().split("T")[0],
      end: pEnd.toISOString().split("T")[0],
      label: "Last Month",
    };
  }
};
