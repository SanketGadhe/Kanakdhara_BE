exports.sma = (arr, period) => {
    const slice = arr.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
};

exports.normalize = (value, min, max) =>
    Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
